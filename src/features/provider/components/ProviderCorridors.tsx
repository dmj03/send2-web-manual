import type { Corridor } from '@/types/provider';

interface ProviderCorridorsProps {
  corridors: Corridor[];
}

export function ProviderCorridors({ corridors }: ProviderCorridorsProps) {
  if (corridors.length === 0) {
    return (
      <p className="text-sm text-gray-400">Corridor information is not currently available.</p>
    );
  }

  // Group by send currency for readability
  const grouped = corridors.reduce<Record<string, Corridor[]>>((acc, c) => {
    const key = c.sendCurrency;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([sendCurrency, group]) => (
        <div key={sendCurrency}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            From {sendCurrency}
          </p>
          <ul className="flex flex-wrap gap-2">
            {group.map((corridor, i) => (
              <li
                key={i}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
              >
                <span className="font-medium">{corridor.receiveCountry}</span>
                <span className="mx-1 text-gray-400">·</span>
                {corridor.receiveCurrency}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
