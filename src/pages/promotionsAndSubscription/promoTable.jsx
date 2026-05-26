import PromoUsageBar from "./promoUsageBar";

export default function PromoTable({ data }) {
  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="min-w-max w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-6 py-4 text-left whitespace-nowrap">Code</th>
            <th className="px-6 py-4 text-left whitespace-nowrap">Discount</th>
            <th className="px-6 py-4 text-left whitespace-nowrap">
              Validity Period
            </th>
            <th className="px-6 py-4 text-left whitespace-nowrap">Usage</th>
            <th className="px-6 py-4 text-left whitespace-nowrap">
              Applicable For
            </th>
            <th className="px-6 py-4 text-left whitespace-nowrap">Status</th>
            <th className="px-6 py-4 text-left whitespace-nowrap">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium">
                  {item.code}
                </span>
              </td>

              <td className="px-6 py-4 font-medium whitespace-nowrap">
                {item.discount}
              </td>

              {/* Validity Period */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex gap-6 items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Start</p>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md text-xs">
                      {item.start}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">End</p>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md text-xs">
                      {item.end}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <PromoUsageBar used={item.used} total={item.total} />
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-xs">
                  {item.category}
                </span>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-gray-400 hover:text-gray-600">
                  ⋮
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
