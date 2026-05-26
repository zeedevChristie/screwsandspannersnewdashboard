export default function PromotionCard({ promo }) {
return (
<div className="bg-white border rounded-xl p-4 shadow-sm">
<div className="flex justify-between items-start mb-2">
<div>
<h3 className="font-semibold text-sm">{promo.title}</h3>
<p className="text-xs text-gray-500">{promo.desc}</p>
</div>
<button className="text-gray-400">⋮</button>
</div>


<div className="bg-red-50 text-red-500 rounded-lg py-4 text-center my-4">
<p className="text-xs">Discount Value</p>
<p className="text-xl font-bold">{promo.value}</p>
</div>


<div className="text-xs text-gray-600 space-y-1">
<p>📅 Start Date: {promo.start}</p>
<p>📅 End Date: {promo.end}</p>
</div>


{promo.used && (
<div className="mt-3">
<p className="text-xs text-gray-500">Usage Progress</p>
<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
<div
className="h-full bg-red-500"
style={{ width: `${(promo.used / promo.limit) * 100}%` }}
/>
</div>
<p className="text-xs text-gray-400 mt-1">
{promo.used} / {promo.limit}
</p>
</div>
)}


<div className="flex gap-2 mt-4">
<span
className={`text-xs px-2 py-1 rounded-full ${
promo.status === "Active"
? "bg-green-100 text-green-600"
: "bg-blue-100 text-blue-600"
}`}
>
{promo.status}
</span>
<span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
All Subscriptions
</span>
</div>
</div>
);
}