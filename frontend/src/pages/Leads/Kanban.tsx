import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { leadsApi } from '../../api/leads';
import type { Lead, LeadStatus } from '../../types/lead';
import { List, Plus, Eye, Edit } from 'lucide-react';
import { LEAD_STATUS_COLORS } from '../../utils/helpers';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost'];

const COLUMN_COLORS: Record<LeadStatus, string> = {
  New: 'bg-gray-100 dark:bg-gray-700/60',
  Contacted: 'bg-blue-50 dark:bg-blue-900/20',
  Interested: 'bg-violet-50 dark:bg-violet-900/20',
  Negotiation: 'bg-amber-50 dark:bg-amber-900/20',
  Won: 'bg-emerald-50 dark:bg-emerald-900/20',
  Lost: 'bg-rose-50 dark:bg-rose-900/20',
};

export default function LeadKanban() {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<Record<LeadStatus, Lead[]>>({
    New: [], Contacted: [], Interested: [], Negotiation: [], Won: [], Lost: [],
  });
  const [isDragging, setIsDragging] = useState(false);

  const { data: leadsData } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: () => leadsApi.getAll({ per_page: 200 }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Re-group leads from server whenever data changes and user is not dragging
  useEffect(() => {
    if (leadsData && !isDragging) {
      const grouped: Record<LeadStatus, Lead[]> = {
        New: [], Contacted: [], Interested: [], Negotiation: [], Won: [], Lost: [],
      };
      leadsData.data.forEach((lead: Lead) => {
        if (grouped[lead.status]) grouped[lead.status].push(lead);
      });
      setColumns(grouped);
    }
  }, [leadsData]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      leadsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId as LeadStatus;
    const dstStatus = destination.droppableId as LeadStatus;

    const newColumns = { ...columns };
    const srcItems = [...newColumns[srcStatus]];
    const [moved] = srcItems.splice(source.index, 1);
    newColumns[srcStatus] = srcItems;

    if (srcStatus === dstStatus) {
      srcItems.splice(destination.index, 0, moved);
      newColumns[srcStatus] = srcItems;
    } else {
      const dstItems = [...newColumns[dstStatus]];
      dstItems.splice(destination.index, 0, { ...moved, status: dstStatus });
      newColumns[dstStatus] = dstItems;
      updateStatusMutation.mutate({ id: draggableId, status: dstStatus });
    }

    setColumns(newColumns);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drag leads between columns to update status</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/leads" className="btn-secondary"><List size={16} />Table View</Link>
          <Link to="/leads/create" className="btn-primary"><Plus size={16} />New Lead</Link>
        </div>
      </div>

      <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[status]}`}>
                    {status}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{columns[status].length}</span>
                </div>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-32 rounded-xl p-2 space-y-2 transition-colors ${COLUMN_COLORS[status]} ${snapshot.isDraggingOver ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''}`}
                  >
                    {columns[status].map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'}`}
                          >
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lead.name}</p>
                            {lead.company && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.company}</p>
                            )}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <Link
                                to={`/leads/${lead.id}`}
                                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye size={13} />
                              </Link>
                              <Link
                                to={`/leads/${lead.id}/edit`}
                                className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit size={13} />
                              </Link>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
