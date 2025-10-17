"use client";

import React, { useMemo } from "react";
import Modal from "./Modal";
import { computePeriodEnd } from "../utils/periodUtils";

type Column = {
  key: string;
  label: string;
  format?: (val: any) => React.ReactNode;
};

type ColumnGroup = {
  label: string;
  columns: Column[];
};

interface PaymentRecord {
  [key: string]: any;
  id: number | string;
  year: number;
  date: string;
  frequency: "quarterly" | "semi-annual" | "annual";
  renewed?: boolean;
  _delinquent?: boolean;
}

interface Props {
  open: boolean;
  record: PaymentRecord | null;
  groups: ColumnGroup[];
  onClose: () => void;
  onEdit?: (record: PaymentRecord) => void;
}

const badge = (text: string, cls: string) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
    {text}
  </span>
);

const isDelinquent = (rec: PaymentRecord) => {
  if (!rec) return false;
  if (rec.renewed) return false;
  const now = new Date();
  if (rec.year < now.getFullYear()) return true;
  const due = computePeriodEnd(rec.date, rec.frequency);
  return due < now;
};

const RecordViewModal: React.FC<Props> = ({ open, record, groups, onClose, onEdit }) => {
  const delinquent = useMemo(() => (record?._delinquent ?? (record ? isDelinquent(record) : false)), [record]);

  if (!record) return null;

  const getDisplay = (col: Column) => {
    const isExpiredDate = col.key === "expiredDate";
    const raw = isExpiredDate
      ? computePeriodEnd(record.date, record.frequency).toLocaleDateString()
      : (record as any)[col.key];

    return col.format ? col.format(raw) : raw ?? "—";
  };

  const titleDate = new Date(record.date).toLocaleDateString();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold">Record</span>
          {/* <span className="text-gray-500">#{String(record.id).slice(0, 8)}</span> */}
          <span className="text-gray-400">•</span>
          <span className="text-gray-700">{titleDate}</span>
          <div className="ml-2 flex flex-wrap items-center gap-1">
            {delinquent && badge("Delinquent", "bg-red-100 text-red-700 ring-1 ring-red-200")}
            {record.renewed
              ? badge("Tax Paid", "bg-green-100 text-green-700 ring-1 ring-green-200")
              : badge("Unpaid", "bg-amber-100 text-amber-700 ring-1 ring-amber-200")}
          </div>
        </div>
      }
      maxWidthClass="max-w-5xl"
      actions={
        <>
          {onEdit && (
            <button
              onClick={() => onEdit(record)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-800 hover:bg-gray-200"
          >
            Close
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {groups.map((group) => {
          const visibleCols = group.columns.filter(
            (c) => c.key !== "permits" || !!(record as any)["permits"]
          );
          if (visibleCols.length === 0) return null;

          return (
            <section
              key={group.label}
              className="rounded-lg ring-1 ring-gray-200 overflow-hidden bg-white"
            >
              <div className="bg-gray-50 px-4 py-2">
                <h4 className="text-sm font-semibold text-gray-800">{group.label}</h4>
              </div>

              {/* Table with clean borders and better wrapping */}
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[38%]" />
                    <col className="w-[62%]" />
                  </colgroup>
                  <tbody className="divide-y divide-gray-100">
                    {visibleCols.map((col) => (
                      <tr key={group.label + "-" + col.key} className="odd:bg-white even:bg-gray-50">
                        <td className="px-4 py-2 align-top text-sm font-medium text-gray-600">
                          {col.label}
                        </td>
                        <td className="px-4 py-2 align-top text-sm text-gray-900 break-words">
                          <div className="min-h-[20px]">
                            {getDisplay(col) ?? <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </Modal>
  );
};

export default RecordViewModal;
