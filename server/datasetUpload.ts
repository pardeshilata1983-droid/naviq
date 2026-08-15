import * as fs from 'fs';
import * as path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';

const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface DatasetFile {
  name: string;
  type: string;
  records: number;
  size?: number;
  preview?: string;
  columns?: string[];
  content?: string;
  structuredData?: any;
}

export interface UploadedDataset {
  id: string;
  name: string;
  ownerId: string;
  files: DatasetFile[];
  totalRecords: number;
  lastAnalyzed: string;
  summary?: string;
  schemas?: { [fileName: string]: string[] };
}

export const customDatasets = new Map<string, UploadedDataset>();

export async function processUpload(file: Express.Multer.File, ownerId: string): Promise<UploadedDataset> {
  const datasetId = `ds-${uuidv4()}`;
  const baseName = file.originalname.replace(/\.[^/.]+$/, '');
  const dataset: UploadedDataset = {
    id: datasetId,
    name: baseName || 'Uploaded Dataset',
    ownerId,
    files: [],
    totalRecords: 0,
    lastAnalyzed: new Date().toISOString(),
    schemas: {},
  };

  const ext = path.extname(file.originalname).toLowerCase();

  const processFile = async (name: string, buffer: Buffer) => {
    let records = 0;
    let content = '';
    let preview = '';
    let columns: string[] = [];
    let structuredData: any = null;
    const fileExt = path.extname(name).toLowerCase();

    try {
      if (fileExt === '.csv') {
        const parsed = parseCsv(buffer, { columns: true, skip_empty_lines: true, relax_column_count: true });
        records = parsed.length;
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
          columns = Object.keys(parsed[0]);
        }
        structuredData = parsed.slice(0, 100); // cache first 100 rows for fast structured lookups
        content = JSON.stringify(parsed);
        preview = parsed.slice(0, 3).map((r: any) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | ')).join('\n');
      } else if (fileExt === '.json') {
        const parsed = JSON.parse(buffer.toString('utf-8'));
        if (Array.isArray(parsed)) {
          records = parsed.length;
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
            columns = Object.keys(parsed[0]);
          }
          structuredData = parsed.slice(0, 100);
        } else if (typeof parsed === 'object' && parsed !== null) {
          records = 1;
          columns = Object.keys(parsed);
          structuredData = [parsed];
        } else {
          records = 1;
        }
        content = JSON.stringify(parsed);
        preview = content.slice(0, 300);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let total = 0;
        let allData: any[] = [];
        workbook.SheetNames.forEach((sheetName: string) => {
          const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
          total += rows.length;
          if (rows.length > 0 && typeof rows[0] === 'object') {
            columns.push(...Object.keys(rows[0]).map(c => `[${sheetName}] ${c}`));
          }
          allData.push({ sheet: sheetName, count: rows.length, data: rows });
        });
        records = total;
        structuredData = allData;
        content = JSON.stringify(allData);
        preview = `Sheets: ${workbook.SheetNames.join(', ')} (${total} total rows)`;
      } else if (fileExt === '.pdf') {
        const data = await pdfParse(buffer);
        records = data.numpages || 1;
        content = data.text || '';
        preview = content.slice(0, 300).replace(/\s+/g, ' ');
      } else if (fileExt === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value || '';
        records = 1;
        preview = content.slice(0, 300).replace(/\s+/g, ' ');
      } else if (fileExt === '.txt' || fileExt === '.md') {
        content = buffer.toString('utf-8');
        records = content.split('\n').filter(l => l.trim().length > 0).length || 1;
        preview = content.slice(0, 300);
      }

      if (content || records > 0) {
        dataset.files.push({
          name,
          type: fileExt,
          records,
          size: buffer.length,
          preview,
          columns,
          content,
          structuredData,
        });
        dataset.totalRecords += records;
        if (columns.length > 0 && dataset.schemas) {
          dataset.schemas[name] = columns;
        }
      }
    } catch (e: any) {
      console.error(`Error processing file ${name}:`, e.message);
    }
  };

  if (ext === '.zip') {
    const zip = new AdmZip(file.path);
    const zipEntries = zip.getEntries();
    for (const zipEntry of zipEntries) {
      if (!zipEntry.isDirectory && !zipEntry.entryName.startsWith('__MACOSX') && !zipEntry.entryName.startsWith('.')) {
        await processFile(zipEntry.entryName, zipEntry.getData());
      }
    }
  } else {
    await processFile(file.originalname, fs.readFileSync(file.path));
  }

  // Cleanup temp file
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // Generate automated index summary
  const fileSummary = dataset.files.map(f => `• ${f.name} (${f.type}): ${f.records} records${f.columns?.length ? `, columns: [${f.columns.slice(0, 8).join(', ')}]` : ''}`).join('\n');
  dataset.summary = `Indexed ${dataset.files.length} file(s) with ${dataset.totalRecords} total records.\n${fileSummary}`;

  customDatasets.set(datasetId, dataset);
  return dataset;
}

export function searchDataset(datasetId: string, query: string) {
  const dataset = customDatasets.get(datasetId);
  if (!dataset) return { error: 'Dataset not found or expired' };

  const q = query.toLowerCase().trim();
  const results: any[] = [];

  for (const f of dataset.files) {
    if (!f.content) continue;

    // Check if query is in raw content
    const lowerContent = f.content.toLowerCase();
    if (lowerContent.includes(q)) {
      // Find matches with surrounding context
      let pos = 0;
      let matchCount = 0;
      while ((pos = lowerContent.indexOf(q, pos)) !== -1 && matchCount < 5) {
        const start = Math.max(0, pos - 150);
        const end = Math.min(f.content.length, pos + q.length + 150);
        results.push({
          source: f.name,
          type: f.type,
          snippet: f.content.substring(start, end).replace(/\n+/g, ' ').trim()
        });
        pos += q.length + 50;
        matchCount++;
      }
    }
  }

  if (results.length === 0) {
    // Return dataset structural metadata so agent can guide the user
    return {
      message: `No exact text match found for "${query}" in uploaded dataset.`,
      datasetSummary: dataset.summary,
      availableFiles: dataset.files.map(f => ({ name: f.name, type: f.type, columns: f.columns, preview: f.preview }))
    };
  }

  return {
    query,
    totalMatches: results.length,
    matches: results,
    filesIndexed: dataset.files.map(f => f.name)
  };
}

export function getDatasetOverview(datasetId: string) {
  const dataset = customDatasets.get(datasetId);
  if (!dataset) return null;
  return {
    id: dataset.id,
    name: dataset.name,
    totalRecords: dataset.totalRecords,
    filesCount: dataset.files.length,
    summary: dataset.summary,
    files: dataset.files.map(f => ({
      name: f.name,
      type: f.type,
      records: f.records,
      size: f.size,
      columns: f.columns,
      preview: f.preview
    }))
  };
}
