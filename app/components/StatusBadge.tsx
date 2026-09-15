export default function StatusBadge({
  totalPaid,
  expected,
}: {
  totalPaid: number;
  expected: number;
}) {
  if (expected === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  if (totalPaid >= expected) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        À jour
      </span>
    );
  }
  if (totalPaid > 0) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Partiel
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      En attente
    </span>
  );
}
