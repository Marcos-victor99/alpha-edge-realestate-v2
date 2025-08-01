import { useState } from "react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import OverviewDashboard from "@/components/Dashboard/OverviewDashboard";
import FinancialDashboard from "@/components/Dashboard/FinancialDashboard";
import InadimplenciaDashboard from "@/components/Dashboard/InadimplenciaDashboard";
import OrcamentoDashboard from "@/components/Dashboard/OrcamentoDashboard";
import AnalyticsDashboard from "@/components/Dashboard/AnalyticsDashboard";
import VisualizacoesDashboard from "@/components/Dashboard/VisualizacoesDashboard";
import TestDataComponent from "@/components/TestDataComponent";

const Index = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewDashboard />;
      case "financial":
        return <FinancialDashboard />;
      case "inadimplencia":
        return <InadimplenciaDashboard />;
      case "orcamento":
        return <OrcamentoDashboard />;
      case "visualizacoes":
        return <VisualizacoesDashboard />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "test":
        return <TestDataComponent />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>
              <p className="text-muted-foreground">
                Esta seção está em desenvolvimento
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;