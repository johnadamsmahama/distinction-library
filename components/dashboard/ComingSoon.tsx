export default function ComingSoon({
  title,
  description,
  stage,
}: {
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="eyebrow mb-3">{stage}</div>
      <h1 className="font-display font-bold text-2xl text-navy mb-3">{title}</h1>
      <p className="font-body text-sm text-g600 leading-relaxed">{description}</p>
    </div>
  );
}
