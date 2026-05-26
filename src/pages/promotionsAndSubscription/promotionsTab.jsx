import PromotionsGrid from "./promotionsGrid";
import PromotionsHeader from "./promotionsHeader";

export default function PromotionsTab() {
return (
<div className="space-y-6">
<PromotionsHeader />
<PromotionsGrid />
</div>
);
}