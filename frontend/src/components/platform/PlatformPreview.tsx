'use client';
import React from 'react';
import { 
  Target, Users, Building2, TrendingUp, Briefcase, CheckSquare, 
  Star, Phone, Mail, Calendar, User, DollarSign, Clock, 
  AlertCircle, CheckCircle2, ArrowRight, MoreHorizontal
} from 'lucide-react';

type PreviewType = 'leads' | 'contacts' | 'companies' | 'pipeline' | 'deals' | 'tasks';

interface PlatformPreviewProps {
  type: PreviewType;
}

export default function PlatformPreview({ type }: PlatformPreviewProps) {
  const renderPreview = () => {
    switch (type) {
      case 'leads':
        return <LeadsPreview />;
      case 'contacts':
        return <ContactsPreview />;
      case 'companies':
        return <CompaniesPreview />;
      case 'pipeline':
        return <PipelinePreview />;
      case 'deals':
        return <DealsPreview />;
      case 'tasks':
        return <TasksPreview />;
      default:
        return <LeadsPreview />;
    }
  };

  return (
    <div className="p-3 md:p-4 bg-gradient-to-br from-gray-50/50 to-white min-h-[300px] lg:min-h-[320px]">
      {renderPreview()}
    </div>
  );
}

function LeadsPreview() {
  const leads = [
    { name: 'Sarah Chen', company: 'TechFlow Inc', score: 89, status: 'Qualified', owner: 'Mike Johnson', lastActivity: '2h ago', priority: 'high' },
    { name: 'David Rodriguez', company: 'Innovate Corp', score: 76, status: 'Contacted', owner: 'Sarah Kim', lastActivity: '1d ago', priority: 'medium' },
    { name: 'Emily Watson', company: 'DataSync Solutions', score: 92, status: 'New', owner: 'Alex Chen', lastActivity: '3h ago', priority: 'high' },
    { name: 'James Park', company: 'CloudFirst Labs', score: 63, status: 'Nurturing', owner: 'Mike Johnson', lastActivity: '2d ago', priority: 'low' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 70) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-gray-700 bg-gray-100 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Qualified': return 'text-green-700 bg-green-100 border-green-200';
      case 'Contacted': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'New': return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'Nurturing': return 'text-orange-700 bg-orange-100 border-orange-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="p-2 bg-gray-50/80 rounded-xl">
      <div className="bg-white rounded-lg border border-gray-200/80 overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                <Target size={13} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Lead Management</h3>
                <p className="text-[10px] text-gray-500 leading-none">Manage and track your sales leads</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold border border-purple-200">
                {leads.length} Active
              </span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {leads.map((lead, idx) => (
            <div key={idx} className="px-3 py-1.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-200">
                      <User size={12} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{lead.name}</div>
                      <div className="text-[10px] text-gray-500 truncate leading-none">{lead.company}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[8.5px] px-1 py-0.2 rounded-full font-semibold border ${getScoreColor(lead.score)}`}>
                      Score {lead.score}
                    </span>
                    <span className={`text-[8.5px] px-1 py-0.2 rounded-full font-semibold border ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                    <span className="text-[9px] text-gray-400">Owner: {lead.owner}</span>
                  </div>
                </div>
                
                <div className="text-right ml-4 flex-shrink-0">
                  <div className={`text-[8.5px] px-1 py-0.2 rounded-full font-semibold border mb-1 ${getPriorityColor(lead.priority)}`}>
                    {lead.priority} priority
                  </div>
                  <div className="text-[9px] text-gray-400 leading-none">{lead.lastActivity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-3 py-1.5 bg-gray-50/50 border-t border-gray-100">
          <button className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5 transition-colors">
            View all leads
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactsPreview() {
  const contacts = [
    { name: 'Sarah Chen', company: 'TechFlow Inc', email: 'sarah@techflow.com', phone: '+1 555-0123', status: 'Active', owner: 'Mike Johnson' },
    { name: 'David Rodriguez', company: 'Innovate Corp', email: 'david@innovate.com', phone: '+1 555-0456', status: 'Active', owner: 'Sarah Kim' },
    { name: 'Emily Watson', company: 'DataSync Solutions', email: 'emily@datasync.com', phone: '+1 555-0789', status: 'Prospect', owner: 'Alex Chen' },
    { name: 'Michael Chang', company: 'Digital Dynamics', email: 'michael@digitaldynamics.com', phone: '+1 555-0321', status: 'Active', owner: 'Lisa Park' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-700 bg-green-100 border-green-200';
      case 'Prospect': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-purple-100 rounded-md flex items-center justify-center border border-blue-200/50">
              <Users size={14} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Contact Management</h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Organize customer relationships</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold border border-blue-200">
              {contacts.length} Contacts
            </span>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {contacts.map((contact, idx) => (
          <div key={idx} className="px-3.5 py-1.5 hover:bg-gray-50/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200/50 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                  <User size={12} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{contact.name}</div>
                  <div className="text-[10px] text-gray-500 truncate leading-none mb-0.5">{contact.company}</div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-400">
                    <div className="flex items-center gap-0.5">
                      <Mail size={8} className="text-gray-400" />
                      <span className="truncate max-w-[100px]">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Phone size={8} className="text-gray-400" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0 space-y-0.5">
                <div className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-semibold border ${getStatusColor(contact.status)}`}>
                  {contact.status}
                </div>
                <div className="text-[9px] text-gray-400">Owner: <span className="text-gray-600 font-medium">{contact.owner}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <button className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors group">
          <span>View all contacts</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function CompaniesPreview() {
  const companies = [
    { name: 'TechFlow Inc', industry: 'Technology', contacts: 3, deals: 2, value: '₹37.8L', owner: 'Mike Johnson' },
    { name: 'Innovate Corp', industry: 'Manufacturing', contacts: 5, deals: 1, value: '₹65.2L', owner: 'Sarah Kim' },
    { name: 'DataSync Solutions', industry: 'Software', contacts: 2, deals: 3, value: '₹77.1L', owner: 'Alex Chen' },
    { name: 'Digital Dynamics', industry: 'Consulting', contacts: 4, deals: 1, value: '₹28.4L', owner: 'Lisa Park' }
  ];

  const getValueColor = (value: string) => {
    const numValue = parseInt(value.replace(/[₹,L]/g, ''));
    if (numValue >= 70) return 'text-green-700 font-bold';
    if (numValue >= 40) return 'text-orange-700 font-bold';
    return 'text-gray-700 font-semibold';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-emerald-100 rounded-md flex items-center justify-center border border-green-200/50">
              <Building2 size={14} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Company Management</h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Centralize account relationships</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold border border-green-200">
              {companies.length} Companies
            </span>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {companies.map((company, idx) => (
          <div key={idx} className="px-3.5 py-1.5 hover:bg-gray-50/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-200/50 group-hover:from-green-200 group-hover:to-green-300 transition-all">
                  <Building2 size={12} className="text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{company.name}</div>
                  <div className="text-[10px] text-gray-500 truncate leading-none mb-0.5">{company.industry}</div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-400">
                    <span>{company.contacts} contacts</span>
                    <span>{company.deals} open</span>
                    <span>Owner: <span className="text-gray-600">{company.owner}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0">
                <div className={`text-xs mb-0.5 ${getValueColor(company.value)}`}>{company.value}</div>
                <div className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded-full font-medium border border-gray-200">
                  Value
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <button className="text-[11px] text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 transition-colors group">
          <span>View all companies</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function PipelinePreview() {
  const stages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
  const deals = [
    { id: 1, name: 'TechFlow Integration', value: 3750000, stage: 'Proposal', company: 'TechFlow Inc', probability: 75 },
    { id: 2, name: 'DataSync Platform', value: 6500000, stage: 'Negotiation', company: 'DataSync Solutions', probability: 90 },
    { id: 3, name: 'Innovate Automation', value: 2680000, stage: 'Qualified', company: 'Innovate Corp', probability: 50 },
    { id: 4, name: 'Digital Transform', value: 5420000, stage: 'Proposal', company: 'Digital Dynamics', probability: 65 }
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Qualified': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Proposal': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Negotiation': return 'bg-green-100 text-green-700 border-green-200';
      case 'Won': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-md flex items-center justify-center border border-purple-200/50">
              <TrendingUp size={14} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Sales Pipeline</h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Track opportunities stage-by-stage</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold border border-purple-200">
              ₹{(totalValue / 100000).toFixed(1)}L
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        {/* Stage indicators */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          {stages.map((stage, idx) => {
            const stageDeals = deals.filter(deal => deal.stage === stage);
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <div key={idx} className="text-center">
                <div className="text-[9px] font-semibold text-gray-600 mb-0.5 leading-none">{stage}</div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(20, (stageValue / totalValue) * 100)}%` }}
                  />
                </div>
                <div className="text-[8px] text-gray-400 mt-0.5 leading-none">{stageDeals.length} d</div>
              </div>
            );
          })}
        </div>
        
        {/* Deal cards */}
        <div className="space-y-1.5">
          {deals.map((deal) => (
            <div key={deal.id} className="group p-2 border border-gray-100 rounded-md hover:bg-gray-50/50 hover:border-purple-200 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{deal.name}</div>
                  <div className="text-[10px] text-gray-500 truncate leading-none mt-0.5">{deal.company}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[8px] px-1 py-0.2 rounded-full font-medium border ${getStageColor(deal.stage)}`}>
                      {deal.stage}
                    </span>
                    <span className="text-[9px] text-gray-400">{deal.probability}% prob</span>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="font-bold text-gray-900 text-[11px]">₹{(deal.value / 100000).toFixed(1)}L</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <button className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors group">
          <span>View full pipeline</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function DealsPreview() {
  const deals = [
    { name: 'TechFlow Integration', company: 'TechFlow Inc', value: 3750000, stage: 'Proposal', probability: 75, closeDate: '2026-09-15', owner: 'Mike Johnson' },
    { name: 'DataSync Platform', company: 'DataSync Solutions', value: 6500000, stage: 'Negotiation', probability: 90, closeDate: '2026-08-30', owner: 'Sarah Kim' },
    { name: 'Innovate Automation', company: 'Innovate Corp', value: 2680000, stage: 'Qualified', probability: 50, closeDate: '2026-10-01', owner: 'Alex Chen' },
    { name: 'Digital Transform', company: 'Digital Dynamics', value: 5420000, stage: 'Proposal', probability: 65, closeDate: '2026-09-20', owner: 'Lisa Park' }
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Proposal': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Negotiation': return 'bg-green-100 text-green-700 border-green-200';
      case 'Qualified': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-100 to-red-100 rounded-md flex items-center justify-center border border-orange-200/50">
              <Briefcase size={14} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Deal Management</h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Track opportunities to close</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold border border-orange-200">
              {deals.length} Active
            </span>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {deals.map((deal, idx) => (
          <div key={idx} className="px-3.5 py-1.5 hover:bg-gray-50/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-100 to-orange-200 rounded-md flex items-center justify-center flex-shrink-0 border border-orange-200/50 group-hover:from-orange-200 group-hover:to-orange-300 transition-all">
                    <Briefcase size={12} className="text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{deal.name}</div>
                    <div className="text-[10px] text-gray-500 truncate leading-none">{deal.company}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap text-[9px]">
                  <span className="font-bold text-green-600 text-[10px]">₹{(deal.value / 100000).toFixed(1)}L</span>
                  <span className={`px-1 py-0.2 rounded-full font-semibold border ${getStageColor(deal.stage)}`}>
                    {deal.stage}
                  </span>
                  <span className={`font-semibold ${getProbabilityColor(deal.probability)}`}>
                    {deal.probability}% prob
                  </span>
                  <span className="text-gray-400">Owner: <span className="text-gray-600">{deal.owner}</span></span>
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-[10px] font-semibold text-gray-900 mb-0.5">Close: {deal.closeDate.split('-').slice(1).join('/')}</div>
                <div className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded-full font-medium border border-gray-200">
                  Expected
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <button className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors group">
          <span>View all deals</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function TasksPreview() {
  const tasks = [
    { title: 'Follow up with TechFlow decision maker', type: 'Call', dueDate: '2026-08-12', priority: 'High', deal: 'TechFlow Integration', owner: 'Mike Johnson', status: 'Pending' },
    { title: 'Send proposal to DataSync team', type: 'Email', dueDate: '2026-08-13', priority: 'High', deal: 'DataSync Platform', owner: 'Sarah Kim', status: 'In Progress' },
    { title: 'Schedule demo for Innovate Corp', type: 'Meeting', dueDate: '2026-08-15', priority: 'Medium', deal: 'Innovate Automation', owner: 'Alex Chen', status: 'Pending' },
    { title: 'Prepare contract for Digital Dynamics', type: 'Task', dueDate: '2026-08-18', priority: 'Medium', deal: 'Digital Transform', owner: 'Lisa Park', status: 'Not Started' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-700 bg-red-100 border-red-200';
      case 'Medium': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Pending': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Not Started': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone size={12} className="text-green-600" />;
      case 'Email': return <Mail size={12} className="text-blue-600" />;
      case 'Meeting': return <Calendar size={12} className="text-purple-600" />;
      default: return <CheckSquare size={12} className="text-gray-600" />;
    }
  };

  const overdueTasks = tasks.filter(task => new Date(task.dueDate) < new Date()).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md flex items-center justify-center border border-indigo-200/50">
              <CheckSquare size={14} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[12px] leading-tight">Tasks & Follow-ups</h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Keep sales activities organized</p>
            </div>
          </div>
          <div className="flex items-center">
            {overdueTasks > 0 && (
              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold border border-red-200 mr-1">
                {overdueTasks} overdue
              </span>
            )}
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-200">
              {tasks.length} Active
            </span>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {tasks.map((task, idx) => (
          <div key={idx} className="px-3.5 py-1.5 hover:bg-gray-50/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-md flex items-center justify-center flex-shrink-0 border border-indigo-200/50 group-hover:from-indigo-200 group-hover:to-indigo-300 transition-all">
                  {getTypeIcon(task.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-[11px] truncate leading-tight">{task.title}</div>
                  <div className="text-[10px] text-gray-500 truncate leading-none mb-0.5">Related: {task.deal}</div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-400">
                    <span>Due: <span className="font-medium text-gray-600">{task.dueDate.split('-').slice(1).join('/')}</span></span>
                    <span>Owner: <span className="font-medium text-gray-600">{task.owner}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0 space-y-0.5">
                <div className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-semibold border ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </div>
                <div className={`text-[8.5px] px-1.5 py-0.2 font-medium border rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-3.5 py-1.5 bg-gradient-to-r from-gray-50/30 to-white border-t border-gray-100">
        <button className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors group">
          <span>View all tasks</span>
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}