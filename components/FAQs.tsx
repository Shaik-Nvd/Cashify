import { Plus } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I know the price of my old phone?',
    a: 'Our smart AI-based pricing engine evaluates your phone based on its make, model, age, and condition. Simply answer a few quick questions about your device to get an instant, competitive quote.'
  },
  {
    q: 'Can I cancel my sale if I change my mind?',
    a: 'Yes, absolutely. You are under no obligation to sell until the pickup executive physically inspects and collects your device, so you can change your mind at any point before the handover.'
  },
  {
    q: 'How and when will I get paid?',
    a: 'You receive your payment instantly at the time of pickup! Our executive will transfer the agreed amount via UPI or bank transfer directly to your account before leaving with the device.'
  }
];

export default function FAQs() {
  return (
    <div className="w-full">
      <h2 id="faq-title" className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
        Questions, answered
      </h2>
      <p className="text-xs text-gray-500 mt-1">
        Everything you need to know about selling or buying your mobile on Cashify
      </p>

      <div className="mt-6 divide-y divide-gray-100">
        {FAQ_ITEMS.map((item, idx) => (
          <details key={item.q} className="group py-4" open={idx === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-gray-900 transition hover:text-[#128085] [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 group-hover:border-[#128085] group-hover:text-[#128085] transition-transform duration-200 group-open:rotate-45 group-open:border-[#128085] group-open:bg-[#eaf6f6] group-open:text-[#128085]">
                <Plus aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
              </span>
            </summary>
            <p className="pt-3 pb-2 text-sm leading-relaxed text-gray-600 max-w-3xl">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
