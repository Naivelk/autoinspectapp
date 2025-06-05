
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InspectionContext } from '../App.tsx';
import PageContainer from '../components/PageContainer.tsx';
import Button from '../components/Button.tsx';
import WizardSteps from '../components/WizardSteps.tsx';
import { InspectionStep, SavedInspection, AllPhotoCategoryKeys, PhotoCategoryConfig } from '../types.ts'; 
import { generatePdf, generatePdfBlobUrl, generatePdfBlobUrlSoloTexto } from '../services/pdfGenerator.ts';
import { saveInspection } from '../services/inspectionService.ts';
import { CheckCircle, AlertCircle } from 'lucide-react';

console.log("SummaryScreen: Module loaded"); 

interface SummaryItemProps {
  label: string;
  value: string | React.ReactNode;
  isMissing?: boolean;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, isMissing = false }) => (
  <div className="py-2 border-b border-gray-200 flex justify-between items-center">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    {isMissing ? (
      <span className="text-sm text-gray-400 italic">(Optional - Not provided)</span>
    ) : (
      <span className="text-sm text-gray-800 text-right break-all">{value}</span>
    )}
  </div>
);

const SummaryScreen: React.FC = () => {
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState<boolean>(false);

  // Reiniciar el estado de generación de PDF cada vez que se monta la pantalla de resumen
  useEffect(() => {
    setIsGeneratingPdf(false);
  }, [currentInspection.id]); // Si el id cambia, también reinicia (nuevo registro o regreso)

  // Reiniciar el estado de generación de PDF cada vez que se monta la pantalla de resumen
  useEffect(() => {
    setIsGeneratingPdf(false);
  }, [currentInspection.id]); // Si el id cambia, también reinicia (nuevo registro o regreso)

  console.log("SummaryScreen: Component rendering/re-rendering"); 
  const context = useContext(InspectionContext);
  const navigate = useNavigate();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("Operation Status");
  const [isQuotaErrorContext, setIsQuotaErrorContext] = useState(false);
  const [canRestartInspectionOnError, setCanRestartInspectionOnError] = useState(false);


  if (!context) return <div>Loading...</div>;
  const { currentInspection, setCurrentStep, currentStep: wizardCurrentStep, resetInspection, setCurrentVehicleIndex } = context;

  useEffect(() => {
    try {
      if (!currentInspection) {
        setVisibleError('No hay datos de inspección. Por favor, vuelve a comenzar.');
        return;
      }
      const basicDetailsMissing = !currentInspection.agentName;
      const photosMissing = currentInspection.vehicles.some(v =>
        !Object.values(v.photos).some(photo => photo?.base64)
      );

      if (basicDetailsMissing) {
        setVisibleError('Faltan los datos del agente. Por favor, vuelve a comenzar.');
        //navigate('/new-inspection');
        return;
      }
      if (photosMissing) {
        const firstVehicleWithMissingPhotos = currentInspection.vehicles.findIndex(v =>
          !Object.values(v.photos).some(photo => photo?.base64)
        );
        setVisibleError(`Falta al menos una foto en el vehículo ${firstVehicleWithMissingPhotos + 1}. Por favor, regresa y agrega una foto.`);
        //setCurrentVehicleIndex(firstVehicleWithMissingPhotos);
        //navigate('/photos');
        return;
      }
      setVisibleError(null);
      setCurrentStep(InspectionStep.SUMMARY);
    } catch (err: any) {
      setVisibleError('Error inesperado: ' + (err?.message || String(err)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInspection, navigate, setCurrentStep, setCurrentVehicleIndex]);


  const handleGeneratePdf = async () => {
    console.log("SummaryScreen: handleGeneratePdf invoked (New Logic)");
    setIsGeneratingPdf(true);
    setModalMessage(null);
    setModalTitle("Operation Status");
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setIsQuotaErrorContext(false);
    setCanRestartInspectionOnError(false);

    const primaryVehicle = currentInspection.vehicles[0] || { make: '', model: '', year: '' };
    let inspectionToProcess: SavedInspection = {
      ...currentInspection,
      id: currentInspection.id || `${currentInspection.agentName.replace(/\s+/g, '-')}_${(primaryVehicle.model || 'vehicle').replace(/\s+/g, '-')}${primaryVehicle.year || ''}_${Date.now()}`,
      inspectionDate: new Date(currentInspection.inspectionDate).toISOString(),
      pdfGenerated: false, // Start with false
    };

    // Step 1: Initial Save
    try {
      console.log("SummaryScreen: Attempting initial save...");
      await saveInspection({ ...inspectionToProcess }); // Save with pdfGenerated: false
      console.log("SummaryScreen: Initial save successful.");
    } catch (initialSaveError: any) {
      console.error("SummaryScreen: Initial save error:", initialSaveError);
      setModalTitle("Save Error");
      if (initialSaveError.message?.startsWith('QuotaExceededError')) {
        setModalMessage('No se pudo guardar la inspección. Por favor, libera espacio o elimina inspecciones antiguas.');
        setIsQuotaErrorContext(true);
        setCanRestartInspectionOnError(true); // Can start new if quota error on first save
      } else {
        setModalMessage(`Failed to save inspection data: ${initialSaveError.message}. PDF generation aborted.`);
      }
      setShowErrorModal(true);
      // isGeneratingPdf will be reset by modal interaction
      return; 
    }

    // Step 2: Generate PDF
    try {
      console.log("SummaryScreen: Attempting PDF generation...");
      await generatePdf(inspectionToProcess); 
      console.log("SummaryScreen: PDF generation successful.");
    } catch (pdfGenError: any) {
      console.error("SummaryScreen: Error generating PDF:", pdfGenError);
      setModalTitle("PDF Generation Failed");
      setModalMessage(`PDF Generation Failed: ${pdfGenError.message}. The initial inspection data (without PDF status) was saved.`);
      setShowErrorModal(true);
      // isGeneratingPdf will be reset by modal interaction
      return;
    }

    // Step 3: Final Save (Update with pdfGenerated = true)
    try {
      console.log("SummaryScreen: Attempting final save (pdfGenerated=true)...");
      inspectionToProcess.pdfGenerated = true;
      saveInspection(inspectionToProcess);
      console.log("SummaryScreen: Final save successful.");
      
      setModalTitle("Success!");
      setModalMessage("PDF generated, downloaded, and inspection successfully saved!");
      setShowSuccessModal(true);
    } catch (finalSaveError: any) {
      console.error("SummaryScreen: Final save error (updating pdfGenerated flag):", finalSaveError);
      setModalTitle("Final Save Error");
      let finalErrorMessage = `PDF Generated & Downloaded. Inspection was initially saved. `;
      if (finalSaveError.message?.startsWith('QuotaExceededError')) {
        finalErrorMessage += "However, updating its 'PDF generated' status failed due to storage limits. The saved record may not reflect PDF generation. Consider clearing space.";
        setIsQuotaErrorContext(true);
      } else {
        finalErrorMessage += `However, updating its 'PDF generated' status failed: ${finalSaveError.message}`;
      }
      setModalMessage(finalErrorMessage);
      setShowErrorModal(true);
    }
    // isGeneratingPdf will be reset by modal interaction in all above paths
  };


  if (visibleError) {
    return (
      <PageContainer title="Error" showBackButton onBack={() => navigate('/photos')}>
        <div className="p-6 text-center text-red-600 font-semibold">
          {visibleError}
        </div>
        <div className="flex justify-center mt-4">
          <Button onClick={() => navigate('/photos')}>Volver a Fotos</Button>
          <Button onClick={() => navigate('/new-inspection')} variant="outline" className="ml-2">Nuevo Registro</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inspection Summary" showBackButton onBack={() => {
        setCurrentVehicleIndex(currentInspection.vehicles.length - 1); 
        navigate('/photos');
    }}>
      <WizardSteps currentStep={wizardCurrentStep} />
      <div className="space-y-6 p-1">

        {/* PDF Preview Section */}
        {isPreviewingPdf && (
          <div className="mb-4 flex flex-col items-center">
            <div className="w-full max-w-[480px] border rounded shadow bg-white p-2">
              <iframe
                src={pdfPreviewUrl || ''}
                title="PDF Preview"
                style={{ width: '100%', height: '60vh', minHeight: 360, border: 'none' }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setIsPreviewingPdf(false)} variant="outline">Cerrar Preview</Button>
              <Button onClick={async () => {
                setIsPreviewingPdf(false);
                await handleGeneratePdf();
              }}>Descargar PDF</Button>
            </div>
          </div>
        )}

        {/* Botón de prueba: PDF SOLO TEXTO */}
        {!isPreviewingPdf && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <Button
              variant="outline"
              onClick={async () => {
                setIsGeneratingPdf(true);
                setModalMessage(null);
                setModalTitle("Generando preview SOLO TEXTO...");
                setShowSuccessModal(false);
                setShowErrorModal(false);
                setPdfPreviewUrl(null);
                try {
                  const url = await generatePdfBlobUrlSoloTexto(currentInspection);
                  setPdfPreviewUrl(url);
                  setIsPreviewingPdf(true);
                } catch (err: any) {
                  setModalTitle("Error de PDF SOLO TEXTO");
                  setModalMessage(String(err));
                  setShowErrorModal(true);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              size="md"
              isLoading={isGeneratingPdf}
              className="w-full sm:w-auto"
            >
              {isGeneratingPdf ? 'Generando...' : 'Vista Previa SOLO TEXTO'}
            </Button>

            {/* PDF Preview Button normal */}
            <Button
              onClick={async () => {
                setIsGeneratingPdf(true);
                setModalMessage(null);
                setModalTitle("Generando preview de PDF...");
                setShowSuccessModal(false);
                setShowErrorModal(false);
                setPdfPreviewUrl(null);
                try {
                  const url = await generatePdfBlobUrl(currentInspection);
                  setPdfPreviewUrl(url);
                  setIsPreviewingPdf(true);
                } catch (err: any) {
                  setModalTitle("Error de Preview PDF");
                  setModalMessage(String(err));
                  setShowErrorModal(true);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              size="lg"
              isLoading={isGeneratingPdf}
              className="w-full sm:w-auto"
            >
              {isGeneratingPdf ? 'Generando Preview...' : 'Vista Previa PDF'}
            </Button>
          </div>
        )}

        <section className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold app-text-secondary mb-3">Inspector & Insured Details</h2>
          <SummaryItem label="Agent's Name" value={currentInspection.agentName} />
          <SummaryItem label="Insured's Name" value={currentInspection.insuredName} isMissing={!currentInspection.insuredName} />
          <SummaryItem label="Insured's DOB" value={currentInspection.insuredDOB ? new Date(currentInspection.insuredDOB).toLocaleDateString() : ''} isMissing={!currentInspection.insuredDOB} />
          <SummaryItem label="Inspection Date" value={new Date(currentInspection.inspectionDate).toLocaleDateString()} />
        </section>

        {currentInspection.vehicles.map((vehicle, index) => {
          const vehicleSectionTitleBase = `Vehicle ${index + 1}`;
          const makeModelDisplay = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
          const vehicleSectionTitle = makeModelDisplay ? `${vehicleSectionTitleBase}: ${makeModelDisplay}` : `${vehicleSectionTitleBase} Details`;

          return (
            <section key={vehicle.clientId || index} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold app-text-secondary mb-3">
                {vehicleSectionTitle}
              </h2>
              <SummaryItem label="Make" value={vehicle.make} isMissing={!vehicle.make} />
              <SummaryItem label="Model" value={vehicle.model} isMissing={!vehicle.model} />
              <SummaryItem label="Year" value={vehicle.year} isMissing={!vehicle.year} />
              
              <h3 className="text-md font-semibold app-text-secondary mt-4 mb-2">Photos for Vehicle {index + 1}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AllPhotoCategoryKeys.map(categoryKey => {
                  const photo = vehicle.photos[categoryKey];
                  if (!photo) return null;
                  const photoConfig = PhotoCategoryConfig[categoryKey];
                  const displayName = photoConfig ? photoConfig.name : categoryKey;

                  return (
                    <div key={photo.id} className="text-center">
                      <span className={`text-xs block mb-1 text-gray-600`}>
                        {displayName}
                      </span>
                      {photo.base64 ? (
                        <img src={photo.base64} alt={displayName} className="w-full h-24 object-cover rounded border" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-xs text-gray-400 italic">(Not provided)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between items-center p-1">
          <Button onClick={() => {
            setCurrentVehicleIndex(currentInspection.vehicles.length - 1); 
            navigate('/photos');
          }} variant="outline" className="w-full sm:w-auto">
            Back to Photos
          </Button>
          <Button onClick={handleGeneratePdf} size="lg" isLoading={isGeneratingPdf} className="w-full sm:w-auto">
            {isGeneratingPdf ? 'Processing...' : 'Generate & Save PDF'}
          </Button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{modalTitle}</h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{modalMessage || "Operation completed successfully."}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => { 
                  setShowSuccessModal(false); 
                  setIsGeneratingPdf(false); 
                  resetInspection(); 
                  navigate('/new-inspection'); 
                }} 
                className="w-full"
              >
                Start New Inspection
              </Button>
              <Button 
                onClick={() => { 
                  setShowSuccessModal(false); 
                  setIsGeneratingPdf(false); 
                  navigate('/inspections'); 
                }} 
                variant="outline" 
                className="w-full"
              >
                View All Inspections
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{modalTitle}</h3>
            <p className="text-gray-600 mb-4 whitespace-pre-line">
              {modalMessage || "An unexpected error occurred."}
            </p>
            
            <div className="space-y-3">
               <Button 
                onClick={() => { 
                  setShowErrorModal(false); 
                  setIsGeneratingPdf(false); 
                  navigate('/inspections'); 
                }} 
                variant="primary" 
                className="w-full"
               >
                View All Inspections {isQuotaErrorContext ? "(Clear Space)" : ""}
              </Button>
              <Button 
                onClick={() => {
                  setShowErrorModal(false); 
                  setIsGeneratingPdf(false); 
                  if (canRestartInspectionOnError) { // Only allow restart if error happened before any save or on quota for first save
                    resetInspection(); 
                    navigate('/new-inspection');
                  }
                }} 
                variant="outline" className="w-full"
              >
                {canRestartInspectionOnError ? "Start New Inspection" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default SummaryScreen;
