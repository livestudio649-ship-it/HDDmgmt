import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CompanyProvider } from '@/lib/company';

createRoot(document.getElementById("root")!).render(
	<CompanyProvider>
		<App />
	</CompanyProvider>
);
