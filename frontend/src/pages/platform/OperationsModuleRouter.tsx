import { useParams } from "react-router-dom";

const Placeholder = ({ label }: { label: string }) => (
  <div style={{ padding: 24 }}>
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400">This route is scaffolded; implement real module workflow here.</p>
  </div>
);

export function OperationsModuleRouter() {
  const { sectionKey = "", pageKey = "" } = useParams();
  const moduleKey = `${sectionKey}:${pageKey}`;
  return <Placeholder label={`Operations • ${moduleKey || "dashboard"}`} />;
}
