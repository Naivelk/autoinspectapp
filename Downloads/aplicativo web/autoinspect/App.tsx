
import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ padding: 32, fontSize: 24, color: 'green', textAlign: 'center' }}>
      Hola mundo
    </div>
  );
};

export default App;

  const [globalError, setGlobalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Error desconocido');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (globalError) {
    return (
      <div style={{ padding: 32, color: 'red', fontWeight: 'bold', textAlign: 'center', background: '#fff' }}>
        Error crítico: {globalError}
        <br />
        <span style={{ fontSize: 14, color: '#333', fontWeight: 'normal' }}>
          Por favor, toma un pantallazo de este mensaje y envíalo a soporte.
        </span>
      </div>
    );
  }

  const [currentInspection, setCurrentInspection] = useState<Inspection>(initialInspectionState());
  const [currentStep, setCurrentStep] = useState<InspectionStep>(InspectionStep.VEHICLE_DETAILS);
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState<number>(0);

  const resetInspection = () => {
    setCurrentInspection(initialInspectionState());
    setCurrentStep(InspectionStep.VEHICLE_DETAILS);
    setCurrentVehicleIndex(0);
  };

  const addVehicle = () => {
    setCurrentInspection(prevInsp => {
      const newVehiclesArray = [...prevInsp.vehicles, initialVehicleState()];
      setCurrentVehicleIndex(newVehiclesArray.length - 1);
      return {
        ...prevInsp,
        vehicles: newVehiclesArray
      };
    });
  };

  const removeVehicle = (indexToRemove: number, latestInspectionData: Inspection) => {
    const originalActiveIndex = currentVehicleIndex; // Index active before this operation

    const updatedVehicles = latestInspectionData.vehicles.filter((_, index) => index !== indexToRemove);
    
    let finalVehiclesList = updatedVehicles;
    if (finalVehiclesList.length === 0) {
      finalVehiclesList = [initialVehicleState()];
    }

    let newCalculatedActiveIndex = originalActiveIndex;
    if (originalActiveIndex === indexToRemove) {
      newCalculatedActiveIndex = Math.max(0, indexToRemove - 1);
    } else if (originalActiveIndex > indexToRemove) {
      newCalculatedActiveIndex = originalActiveIndex - 1;
    }
    newCalculatedActiveIndex = Math.min(newCalculatedActiveIndex, finalVehiclesList.length - 1);
    
    setCurrentInspection({
      ...latestInspectionData, // Use the passed latest data as base
      vehicles: finalVehiclesList 
    });
    setCurrentVehicleIndex(newCalculatedActiveIndex);
  };
  
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.hash;
      if (!path.startsWith('#/new') && !path.startsWith('#/photos') && !path.startsWith('#/summary')) {
        // Consider resetting or other logic if needed
      }
    };
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);


  return (
    <InspectionContext.Provider value={{ 
      currentInspection, setCurrentInspection, 
      currentStep, setCurrentStep, 
      currentVehicleIndex, setCurrentVehicleIndex,
      addVehicle, removeVehicle,
      resetInspection 
    }}>
      <HashRouter>
        <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl app-bg-page" style={{backgroundColor: 'var(--app-color-background)'}}>
          <div className="flex-grow overflow-y-auto pb-16">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/new-inspection" element={<NewInspectionScreen />} />
              <Route path="/photos" element={<PhotoCaptureScreen />} />
              <Route path="/summary" element={<SummaryScreen />} />
              <Route path="/inspections" element={<InspectionsListScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/settings/profile" element={<ProfileScreen />} />
              <Route path="/settings/help" element={<HelpScreen />} />
              <Route path="/settings/terms" element={<TermsScreen />} />
              <Route path="/settings/privacy" element={<PrivacyScreen />} />
              <Route path="/settings/contact" element={<ContactScreen />} />
              <Route path="/settings/license" element={<LicenseScreen />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </HashRouter>
    </InspectionContext.Provider>
  );
};

export default App;
