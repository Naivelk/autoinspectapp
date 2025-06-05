
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileDown, Trash2, FileText, Edit3 } from 'lucide-react'; // Added Edit3
import PageContainer from '../components/PageContainer.tsx';
import Button from '../components/Button.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import { SavedInspection, InspectionStep } from '../types.ts'; // Added InspectionStep
import { getInspections, overwriteAllInspections, getInspectionById } from '../services/inspectionService.ts';
import { generatePdf } from '../services/pdfGenerator.ts'; 
import { InspectionContext } from '../App.tsx'; // Added InspectionContext

const InspectionCard: React.FC<{ 
  inspection: SavedInspection; 
  onDelete: (id: string) => void; 
  onDownloadPdf: (inspection: SavedInspection) => Promise<void>; 
  onEdit: (id: string) => void; // Added onEdit prop
}> = ({ inspection, onDelete, onDownloadPdf, onEdit }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadPdf(inspection);
    } catch (error) {
      toast.error(`Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const primaryVehicle = inspection.vehicles && inspection.vehicles.length > 0 
    ? inspection.vehicles[0] 
    : { make: '', model: '', year: ''};
  
  let mainDesc = [primaryVehicle.make, primaryVehicle.model].filter(Boolean).join(' ').trim();
  if (!mainDesc) {
    mainDesc = "Vehicle Details";
  }

  const vehicleSummaryText = inspection.vehicles && inspection.vehicles.length > 1 
    ? `${mainDesc} & ${inspection.vehicles.length - 1} more`
    : mainDesc;
  
  const yearDisplay = primaryVehicle.year ? `(${primaryVehicle.year})` : '';

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-md font-semibold app-text-primary">{vehicleSummaryText} {yearDisplay}</h3>
          <p className="text-xs text-gray-500">Insured: {inspection.insuredName || "(Not provided)"}</p>
          <p className="text-xs text-gray-500">Date: {new Date(inspection.inspectionDate).toLocaleDateString()}</p>
          <p className={`text-xs ${inspection.pdfGenerated ? 'text-green-600' : 'text-yellow-600'}`}>
            PDF: {inspection.pdfGenerated ? 'Generated' : 'Not Generated / Error'}
          </p>
        </div>
        <div className="flex flex-col space-y-2 items-end">
           <Button onClick={handleDownload} variant="outline" size="sm" isLoading={isDownloading} className="app-text-primary app-border-primary w-full justify-start">
            <FileDown size={16} className="mr-1" /> {isDownloading ? 'Processing...' : (inspection.pdfGenerated ? 'Re-Download' : 'Generate PDF')}
          </Button>
          <Button onClick={() => onEdit(inspection.id)} variant="outline" size="sm" className="w-full justify-start">
            <Edit3 size={16} className="mr-1" /> Edit
          </Button>
          <Button onClick={() => onDelete(inspection.id)} variant="danger" size="sm" className="w-full justify-start">
            <Trash2 size={16} className="mr-1" /> Delete
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 break-all">ID: {inspection.id}</p>
    </div>
  );
};

const InspectionsListScreen: React.FC = () => {
  const [inspections, setInspections] = useState<SavedInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [inspectionToDeleteId, setInspectionToDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const context = useContext(InspectionContext);

  if (!context) {
    console.error("InspectionContext not found in InspectionsListScreen");
    return <div className="p-4">Error: Application context is not available.</div>;
  }

  const { setCurrentInspection, setCurrentStep, setCurrentVehicleIndex } = context;

  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedInspections = await getInspections();
      setInspections(savedInspections.sort((a,b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()));
    } catch (e) {
      console.error("Failed to load inspections:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const triggerDeleteInspection = (id: string) => {
    setInspectionToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteInspection = async () => {
    if (inspectionToDeleteId) {
      const updatedInspections = inspections.filter(insp => insp.id !== inspectionToDeleteId);
      setInspections(updatedInspections); 
      await overwriteAllInspections(updatedInspections); 
    }
    setInspectionToDeleteId(null);
    setShowDeleteConfirmModal(false);
  };
  
  const cancelDeleteInspection = () => {
    setInspectionToDeleteId(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDownloadPdf = async (inspection: SavedInspection) => {
    await generatePdf(inspection); 
    const currentInspections = await getInspections(); 
    const updatedInspectionFromFile = currentInspections.find(i => i.id === inspection.id);
    if (updatedInspectionFromFile) {
        setInspections(prev => prev.map(i => i.id === inspection.id ? updatedInspectionFromFile : i)
                                   .sort((a,b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()));
    } else { 
        fetchInspections();
    }
  };

  const handleEditInspection = async (id: string) => {
    console.log("Editing inspection with ID:", id);
    const inspectionToEdit = await getInspectionById(id); // Using the new service function
    if (inspectionToEdit) {
      setCurrentInspection(inspectionToEdit);
      setCurrentVehicleIndex(0); // Start editing with the first vehicle
      setCurrentStep(InspectionStep.VEHICLE_DETAILS); // Set the wizard to the first step
      navigate('/new-inspection');
    } else {
      toast.error("Error: Could not find the inspection to edit.");
      console.error("Inspection with ID not found for editing:", id);
    }
  };


  const inspectionBeingDeleted = inspections.find(insp => insp.id === inspectionToDeleteId);
  const vehicleInfoForModal = inspectionBeingDeleted?.vehicles?.[0]?.make && inspectionBeingDeleted?.vehicles?.[0]?.model
    ? `${inspectionBeingDeleted.vehicles[0].make} ${inspectionBeingDeleted.vehicles[0].model}`
    : `this inspection`;

  return (
    <PageContainer title="Saved Inspections">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading inspections...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-10">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Inspections Found</h3>
          <p className="text-gray-500 mb-6">Start by creating a new vehicle inspection.</p>
          <Button onClick={() => navigate('/new-inspection')} size="lg">
            <PlusCircle size={20} className="mr-2" />
            Create New Inspection
          </Button>
        </div>
      ) : (
        <div className="p-1">
          {inspections.map((inspection) => (
            <InspectionCard 
              key={inspection.id} 
              inspection={inspection} 
              onDelete={triggerDeleteInspection} 
              onDownloadPdf={handleDownloadPdf}
              onEdit={handleEditInspection}
            />
          ))}
           <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate('/new-inspection')} size="lg" variant="primary">
              <PlusCircle size={20} className="mr-2" />
              Create Another Inspection
            </Button>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={cancelDeleteInspection}
        onConfirm={confirmDeleteInspection}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${vehicleInfoForModal}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </PageContainer>
  );
};

export default InspectionsListScreen;
