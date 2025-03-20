// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Define an interface for the Excel record (adjust the properties as needed)
interface ExcelRecord {
  Address?: string;
  // You can add other properties if needed
  [key: string]: unknown;
}

const barangays = [
  "Malbang",
  "Nomoh",
  "Seven Hills",
  "Pananag",
  "Daliao",
  "Colon",
  "Amsipit",
  "Bales",
  "Kamanga",
  "Kablacan",
  "Kanalo",
  "Lumatil",
  "Lumasal",
  "Tinoto",
  "Public Market",
  "Pobalcion",
  "Kabatiol",
];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Read the file as an ArrayBuffer and parse it using XLSX
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Cast the data to an array of ExcelRecord objects
  const data = XLSX.utils.sheet_to_json<ExcelRecord>(worksheet);

  // Group records by barangay based on the "Address" field
  const groupedRecords: { [barangay: string]: ExcelRecord[] } = {};

  for (const record of data) {
    // Now record is of type ExcelRecord so we can access record.Address safely
    const address = record.Address || '';
    let matched = false;
    if (address) {
      for (const barangay of barangays) {
        if (address.toLowerCase().includes(barangay.toLowerCase())) {
          if (!groupedRecords[barangay]) {
            groupedRecords[barangay] = [];
          }
          groupedRecords[barangay].push(record);
          matched = true;
          break; // Stop after the first match
        }
      }
    }
    if (!matched) {
      if (!groupedRecords["Unassigned"]) {
        groupedRecords["Unassigned"] = [];
      }
      groupedRecords["Unassigned"].push(record);
    }
  }

  return NextResponse.json({ groupedRecords });
}
