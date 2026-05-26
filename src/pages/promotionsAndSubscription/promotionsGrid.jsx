import PromotionCard from "./promotionCard";


const promotions = [
{
id: 1,
title: "Summer Special 2024",
desc: "Get 20% off on all home services",
value: "20%",
start: "6/1/2024",
end: "8/31/2024",
used: 245,
limit: 500,
status: "Active",
},
{
id: 2,
title: "New Customer Welcome",
desc: "₦5,000 off first service",
value: "₦5,000",
start: "1/1/2024",
end: "12/31/2024",
status: "Active",
},
{
id: 3,
title: "Black Friday Mega Sale",
desc: "40% off all premium subscriptions",
value: "40%",
start: "11/29/2024",
end: "11/30/2024",
status: "Scheduled",
},
{
id: 4,
title: "New Year Bonus",
desc: "Get 2x of your subscriptions",
value: "2X",
start: "11/29/2024",
end: "11/30/2024",
status: "Scheduled",
},
];


export default function PromotionsGrid () {
return (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{promotions.map((promo) => (
<PromotionCard key={promo.id} promo={promo} />
))}
</div>
);
} 