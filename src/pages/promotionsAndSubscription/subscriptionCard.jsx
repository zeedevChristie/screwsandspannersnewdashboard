export default function SubscriptionCard({
  title,
  description,
  price,
  features,
  subscribers,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {title}
            </h3>
            <p className="text-sm text-gray-500">
              {description}
            </p>
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            ⋮
          </button>
        </div>

        <div className="bg-red-50 text-red-600 font-bold text-2xl rounded-lg py-6 text-center my-6">
          ₦{price.toLocaleString()}
          <p className="text-sm text-gray-500 font-normal">
            per 1 month
          </p>
        </div>

        <ul className="space-y-3">
          {features.map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-gray-600 text-sm"
            >
              <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-6">
        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
          Active
        </span>

        <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
          <p className="font-semibold text-gray-800">
            {subscribers}
          </p>
          <p className="text-xs text-gray-500">Subscribers</p>
        </div>
      </div>
    </div>
  );
}
