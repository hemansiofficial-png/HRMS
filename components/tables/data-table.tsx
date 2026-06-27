import { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  rows: Array<Array<string | number | ReactNode>>;
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`row-${index}`} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {row.map((cell, i) => (
                <td key={`${index}-${i}`} className="px-3 py-2 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
