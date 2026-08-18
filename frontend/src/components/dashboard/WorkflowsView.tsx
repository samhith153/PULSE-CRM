'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Lightbulb,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react';

import {
  getLeads,
  getDeals,
  getPipelineStages,
  fetchBatchRecommendations,
  getLeadWorkflow,
  formatINR,
  type Lead,
  type Deal,
  type BatchRecommendationItem,
  type LeadWorkflowResponse,
  type WorkflowTaskItem,
} from '@/utils/api';
const REFRESH_MS = 30000;

function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim().replace(/[^a-z]/g, '');
}

function displayStage(
  deal: Deal | null,
  lead: Lead | null
): string {
  const dealStage = (deal as any)?.stage;

  if (dealStage) {
    return String(dealStage);
  }

  const raw = lead?.status || 'New Lead';

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '';

  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return '';
  }

  const diff = Math.max(0, Date.now() - then);

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(iso).toLocaleDateString();
}

function candidateLabel(
  candidate: Record<string, unknown>
): string {
  return String(
    candidate.name ??
      candidate.action ??
      candidate.label ??
      candidate.title ??
      'Recommended action'
  );
}

function candidateScore(
  candidate: Record<string, unknown>
): number {
  const value =
    candidate.score ??
    candidate.weight ??
    candidate.rank ??
    0;

  return typeof value === 'number'
    ? value
    : Number(value) || 0;
}

function candidatePriority(
  candidate: Record<string, unknown>
): 'high' | 'medium' | 'low' | null {
  const value = String(
    candidate.priority ??
      candidate.urgency ??
      ''
  ).toLowerCase();

  if (
    value === 'high' ||
    value === 'medium' ||
    value === 'low'
  ) {
    return value;
  }

  return null;
}

function firstName(lead: Lead): string {
  return (
    lead.contact_name ||
    lead.title ||
    'Lead'
  ).split(' ')[0];
}

function workflowTaskDate(
  task: WorkflowTaskItem
): string | null {
  return (
    task.completed_at ||
    task.created_at ||
    null
  );
}

export default function WorkflowsView({
  onLoaded,
}: {
  onLoaded?: () => void;
} = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineStages, setPipelineStages] =
  useState<any[]>([]);

  const [selectedLeadId, setSelectedLeadId] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [fullWorkflowOpen, setFullWorkflowOpen] =
    useState(false);

  const [loadingBase, setLoadingBase] =
    useState(true);

  const [baseError, setBaseError] =
    useState<string | null>(null);  const [recItem, setRecItem] = useState<BatchRecommendationItem | null>(null);

  const [loadingRec, setLoadingRec] = useState(false);

  type PlannedWorkflowStep = {
    action_type: string;
    current_stage?: string | null;
    reasoning?: string[] | null;
    priority?: string | null;
    score?: number | null;
    status?: string;
    kind?: 'stage' | 'action';
  };

  const [workflow, setWorkflow] = useState<{
    current_task: WorkflowTaskItem | null;
    history: WorkflowTaskItem[];
    planned_steps: PlannedWorkflowStep[];
    total_steps: number;
    completed_steps: number;
    progress_percent: number;
  }>({
    current_task: null,
    history: [],
    planned_steps: [],
    total_steps: 0,
    completed_steps: 0,
    progress_percent: 0,
  });

  const [loadingWorkflow, setLoadingWorkflow] =
    useState(false);

  

  /*
   * ------------------------------------------------------------
   * BASE CRM DATA
   * ------------------------------------------------------------
   */

  const loadBase = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingBase(true);
      }

      setBaseError(null);

      try {
        const [leadList, dealList, stageList] =
          await Promise.all([
            getLeads(),
            getDeals(),
            getPipelineStages(),
          ]);

        setLeads(leadList || []);
        setDeals(dealList || []);
        setPipelineStages(
          Array.isArray(stageList)
            ? [...stageList].sort(
                (a, b) =>
                  Number(a.sort_order ?? 0) -
                  Number(b.sort_order ?? 0)
              )
            : []
        );

        setSelectedLeadId((previous) => {
          if (
            previous &&
            leadList?.some(
              (lead) => lead.id === previous
            )
          ) {
            return previous;
          }

          return leadList?.[0]?.id || '';
        });
      } catch (error) {
        console.error(
          'Failed to load workflow leads:',
          error
        );

        if (!silent) {
          setBaseError(
            'Could not load leads or pipeline data. Try refreshing.'
          );
        }
      } finally {
        if (!silent) {
          setLoadingBase(false);
          onLoaded?.();
        }
      }
    },
    [onLoaded]
  );

  useEffect(() => {
    loadBase();

    const interval = window.setInterval(
      () => loadBase(true),
      REFRESH_MS
    );

    return () =>
      window.clearInterval(interval);
  }, [loadBase]);

  

  useEffect(() => {
    const refresh = () =>
      loadBase(true);

    const visibility = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadBase(true);
      }
    };

    window.addEventListener(
      'pipeline-stage-updated',
      refresh
    );

    window.addEventListener(
      'focus',
      refresh
    );

    document.addEventListener(
      'visibilitychange',
      visibility
    );

    return () => {
      window.removeEventListener(
        'pipeline-stage-updated',
        refresh
      );

      window.removeEventListener(
        'focus',
        refresh
      );

      document.removeEventListener(
        'visibilitychange',
        visibility
      );
    };
  }, [loadBase]);

  /*
   * ------------------------------------------------------------
   * SELECTED LEAD / DEAL
   * ------------------------------------------------------------
   */

  const selectedLead = useMemo(
    () =>
      leads.find(
        (lead) =>
          lead.id === selectedLeadId
      ) || null,
    [leads, selectedLeadId]
  );

  const selectedDeal = useMemo(
    () =>
      deals.find(
        (deal) =>
          deal.lead_id === selectedLeadId
      ) || null,
    [deals, selectedLeadId]
  );

  /*
   * ------------------------------------------------------------
   * AI ENTITY
   * ------------------------------------------------------------
   */

  const entity = selectedLead
    ? {
        type: selectedDeal
          ? ('deal' as const)
          : ('lead' as const),
        id: selectedLead.id,
      }
    : null;

  /*
   * ------------------------------------------------------------
   * AI RECOMMENDATION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!entity) {
      setRecItem(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingRec(true);

      try {
        const response =
          await fetchBatchRecommendations([
            entity.id,
          ]);

        if (!cancelled) {
          setRecItem(
            response.recommendations?.[
              entity.id
            ] ?? null
          );
        }
      } catch (error) {
        console.error(
          'Failed to load AI recommendation:',
          error
        );

        if (!cancelled) {
          setRecItem(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRec(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entity?.type, entity?.id]);

  /*
   * ------------------------------------------------------------
   * REAL PERSONALIZED WORKFLOW
   *
   * IMPORTANT:
   *
   * This is NOT generated from pipeline stages.
   *
   * It comes directly from:
   *
   *   workflow.history
   *   +
   *   workflow.current_task
   *
   * Therefore every lead gets its own workflow.
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedLeadId) {
      setWorkflow({
        current_task: null,
        history: [],
        planned_steps: [],
        total_steps: 0,
        completed_steps: 0,
        progress_percent: 0,
      });

      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingWorkflow(true);

      try {
        const result =
          await getLeadWorkflow(
            selectedLeadId
          );

        if (!cancelled) {
          setWorkflow({
  current_task:
    result?.current_task ?? null,

  history: Array.isArray(
    result?.history
  )
    ? result.history
    : [],

  planned_steps: Array.isArray(
    result?.planned_steps
  )
    ? result.planned_steps
    : [],

  total_steps:
    Number(
      result?.total_steps
    ) || 0,

  completed_steps:
    Number(
      result?.completed_steps
    ) || 0,

  progress_percent:
    Number(
      result?.progress_percent
    ) || 0,
});
        }
      } catch (error) {
        console.error(
          'Failed to load personalized workflow:',
          error
        );

        if (!cancelled) {
          setWorkflow({
            current_task: null,
            history: [],
            planned_steps: [],
            total_steps: 0,
            completed_steps: 0,
            progress_percent: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkflow(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  /*
   * ------------------------------------------------------------
   * LEAD SEARCH
   * ------------------------------------------------------------
   */

  const filteredLeads = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return leads;
    }

    return leads.filter((lead) =>
      [
        lead.title,
        lead.contact_name,
        lead.company_name,
        lead.contact_email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  }, [leads, search]);

  /*
   * ------------------------------------------------------------
   * PIPELINE INFORMATION
   *
   * Pipeline stage remains separate from workflow.
   * ------------------------------------------------------------
   */

  const currentStage =
    displayStage(
      selectedDeal,
      selectedLead
    );

  const leadHealth =
    selectedLead?.score ??
    recItem?.current_score ??
    null;

  const isWon =
    normalize(currentStage).includes(
      'won'
    );

  const isLost =
    normalize(currentStage).includes(
      'lost'
    );

  const isConverted =
    Boolean(selectedDeal);

  /*
   * ------------------------------------------------------------
   * AI CANDIDATE ACTIONS
   * ------------------------------------------------------------
   */

  const rankedActions = useMemo(() => {
    if (!recItem) {
      return [];
    }

    const candidates =
      (recItem.all_candidates ||
        []) as Record<
        string,
        unknown
      >[];

    if (candidates.length) {
      return [...candidates]
        .sort(
          (a, b) =>
            candidateScore(b) -
            candidateScore(a)
        )
        .map((candidate) => ({
          label:
            candidateLabel(candidate),

          priority:
            candidatePriority(candidate),

          score:
            candidateScore(candidate),
        }));
    }

    return recItem.recommended_action
      ? [
          {
            label:
              recItem.recommended_action,
            priority: null,
            score: 0,
          },
        ]
      : [];
  }, [recItem]);

  /*
   * ------------------------------------------------------------
   * CURRENT AI RECOMMENDATION
   * ------------------------------------------------------------
   */

  const topAction =
    workflow.current_task
      ?.action_type ||
    rankedActions[0]?.label ||
    (recItem
      ? 'Review lead and choose the next best action'
      : 'Waiting for AI assessment');

  const topPriority =
    workflow.current_task?.priority
      ?.toLowerCase() ||
    rankedActions[0]?.priority ||
    null;

  /*
   * ------------------------------------------------------------
   * RECOVERY DETECTION
   * ------------------------------------------------------------
   */

  const recoveryTriggered =
    useMemo(() => {
      const reason =
        `${recItem?.reason || ''} ${
          recItem?.recommended_action || ''
        }`.toLowerCase();

      return /(no response|stale|overdue|stalled|disengag|no activity)/.test(
        reason
      );
    }, [recItem]);

    /*
    * ------------------------------------------------------------
    * WORKFLOW PROGRESS
    *
    * ONE visual journey per lead:
    *
    * Previous CRM stages  -> COMPLETED
    * Current CRM stage    -> COMPLETED/REACHED
    * Current AI action    -> CURRENT
    * Future CRM stages    -> PLANNED
    *
    * Example:
    *
    * New                 ✓
    * AI Assessment       ✓
    * Contact Initiated   ✓
    * Qualified           ✓
    * Schedule demo       ⭐ CURRENT
    * Proposal            ○
    * Negotiation         ○
    * Won                 ○
    *
    * The AI action is dynamic and comes from the lead's
    * current workflow task / AI recommendation.
    *
    * We do NOT create future AI tasks here.
    * We only display the current recommendation.
    * ------------------------------------------------------------
    */
  const workflowSteps = useMemo(() => {
    type WorkflowStep = {
      id: string;
      label: string;
      reasoning: string;
      status: 'done' | 'current' | 'planned';
      due_at: string | null;
      completed_at: string | null;
      created_at: string | null;
      current_stage?: string | null;
      kind: 'stage' | 'action';
    };

    const steps: WorkflowStep[] = [];

    /*
    * ============================================================
    * PIPELINE STAGES
    *
    * These are ONLY visual stages.
    * They are NOT workflow tasks.
    *
    * Example:
    * New Lead → Qualified → Proposal → Negotiation → Won
    * ============================================================
    */

    const stages = [...pipelineStages]
      .sort(
        (a, b) =>
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)
      )
      .map((stage) => ({
        id: String(
          stage.id ??
            stage.name ??
            stage.label ??
            stage.stage_name ??
            ''
        ),
        name: String(
          stage.name ??
            stage.label ??
            stage.stage_name ??
            ''
        ).trim(),
      }))
      .filter((stage) => stage.name)
      .filter(
        (stage) =>
          !normalize(stage.name).includes('lost')
      );

    /*
    * ============================================================
    * COMPLETED AI TASKS
    *
    * These belong ONLY to this lead.
    *
    * They remain visible as previous recommendations.
    * ============================================================
    */

    const completedTasks = [...workflow.history]
      .filter(
        (task) =>
          task.status === 'completed' ||
          task.status === 'superseded'
      )
      .sort(
        (a, b) =>
          Number(a.step_order ?? 0) -
          Number(b.step_order ?? 0)
      );

    /*
    * ============================================================
    * CURRENT AI TASK
    *
    * There must be ONLY ONE.
    * ============================================================
    */

    const currentTask =
      workflow.current_task;

    const currentAction =
      currentTask?.action_type?.trim() || '';

    /*
    * ============================================================
    * FIND THE STAGE WHERE THE CURRENT AI ACTION BELONGS
    *
    * Example:
    *
    * current_stage = "Qualified"
    * current action = "Send case study or testimonial"
    *
    * Therefore:
    *
    * ✓ Qualified
    * ⭐ Send case study or testimonial
    * ○ Proposal
    * ○ Negotiation
    * ○ Won
    * ============================================================
    */

    const currentWorkflowStage =
      normalize(
        currentTask?.current_stage ||
          currentStage
      );

    let currentStageIndex =
      stages.findIndex(
        (stage) =>
          normalize(stage.name) ===
          currentWorkflowStage
      );

    /*
    * If backend does not provide current_stage,
    * use the latest completed task's stage.
    */
    if (currentStageIndex < 0) {
      const latestStage =
        [...completedTasks]
          .reverse()
          .find(
            (task) =>
              task.current_stage
          )?.current_stage;

      if (latestStage) {
        currentStageIndex =
          stages.findIndex(
            (stage) =>
              normalize(stage.name) ===
              normalize(latestStage)
          );
      }
    }

    /*
    * If still unknown, start at the first stage.
    */
    if (currentStageIndex < 0) {
      currentStageIndex = 0;
    }

    /*
    * ============================================================
    * DUPLICATE PROTECTION
    * ============================================================
    */

    const usedLabels =
      new Set<string>();

    const addStep = (
      step: WorkflowStep
    ) => {
      const key =
        normalize(step.label);

      if (!key) {
        return;
      }

      if (usedLabels.has(key)) {
        return;
      }

      usedLabels.add(key);
      steps.push(step);
    };

    /*
    * ============================================================
    * 1. PREVIOUS PIPELINE STAGES
    *
    * Everything before the current workflow stage
    * is visually completed.
    * ============================================================
    */

    stages.forEach(
      (stage, index) => {
        if (
          index <
          currentStageIndex
        ) {
          addStep({
            id: `stage-${stage.id}`,
            label: stage.name,
            reasoning:
              `CRM pipeline stage completed: ${stage.name}.`,
            status: 'done',
            due_at: null,
            completed_at: null,
            created_at: null,
            current_stage:
              stage.name,
            kind: 'stage',
          });
        }
      }
    );

    /*
    * ============================================================
    * 2. PREVIOUS AI RECOMMENDATIONS
    *
    * Put completed AI actions in their actual order.
    *
    * This is what gives:
    *
    * ✓ New Lead
    * ✓ Send introductory email
    * ✓ Qualified
    * ⭐ Current recommendation
    * ============================================================
    */

    completedTasks.forEach(
      (task) => {
        addStep({
          id: `completed-${task.id}`,
          label:
            task.action_type ||
            'Completed action',
          reasoning:
            task.reasoning ||
            'AI-recommended action completed.',
          status: 'done',
          due_at:
            task.due_at ?? null,
          completed_at:
            task.completed_at ?? null,
          created_at:
            task.created_at ?? null,
          current_stage:
            task.current_stage ?? null,
          kind: 'action',
        });
      }
    );

    /*
    * ============================================================
    * 3. CURRENT STAGE
    *
    * Show the CRM stage immediately before the current
    * AI recommendation.
    *
    * Example:
    *
    * ✓ Qualified
    * ⭐ Send case study
    * ============================================================
    */

    if (
      stages[currentStageIndex]
    ) {
      addStep({
        id: `current-stage-${stages[currentStageIndex].id}`,
        label:
          stages[currentStageIndex].name,
        reasoning:
          `Current CRM pipeline stage: ${stages[currentStageIndex].name}.`,
        status: 'done',
        due_at: null,
        completed_at: null,
        created_at: null,
        current_stage:
          stages[currentStageIndex].name,
        kind: 'stage',
      });
    }

    /*
    * ============================================================
    * 4. ONE CURRENT AI RECOMMENDATION
    *
    * This is the ONLY active workflow task shown.
    * ============================================================
    */

    if (
      currentAction &&
      !isWon &&
      !isLost
    ) {
      addStep({
        id: `current-action-${
          currentTask?.id ??
          selectedLeadId
        }`,
        label: currentAction,
        reasoning:
          currentTask?.reasoning ||
          recItem?.reason ||
          'AI-recommended next best action.',
        status: 'current',
        due_at:
          currentTask?.due_at ??
          null,
        completed_at: null,
        created_at:
          currentTask?.created_at ??
          null,
        current_stage:
          currentTask?.current_stage ??
          stages[currentStageIndex]?.name ??
          null,
        kind: 'action',
      });
    }

    /*
    * ============================================================
    * 5. FUTURE PIPELINE STAGES
    *
    * These are visual only.
    *
    * They must NOT create workflow tasks.
    * ============================================================
    */

    stages.forEach(
      (stage, index) => {
        if (
          index >
          currentStageIndex
        ) {
          addStep({
            id: `future-stage-${stage.id}`,
            label: stage.name,
            reasoning:
              `Future CRM pipeline stage: ${stage.name}.`,
            status: 'planned',
            due_at: null,
            completed_at: null,
            created_at: null,
            current_stage:
              stage.name,
            kind: 'stage',
          });
        }
      }
    );

    /*
    * ============================================================
    * FINAL SAFETY
    *
    * Only ONE current item.
    * ============================================================
    */

    let currentFound = false;

    return steps.map(
      (step) => {
        if (
          step.status !== 'current'
        ) {
          return step;
        }

        if (!currentFound) {
          currentFound = true;
          return step;
        }

        return {
          ...step,
          status: 'planned',
        };
      }
    );
  }, [
    workflow.current_task,
    workflow.history,
    pipelineStages,
    currentStage,
    selectedLeadId,
    recItem?.reason,
    isWon,
    isLost,
  ]);
  const aiActionsCount = useMemo(() => {
    const completed = workflow.history.filter(
      (task) =>
        task.status === 'completed' ||
        task.status === 'superseded'
    ).length;

    /*
    * planned_steps contains the current
    * task as well, so do NOT add
    * current_task separately.
    */
    const workflowPlan =
      Array.isArray(
        workflow.planned_steps
      )
        ? workflow.planned_steps
        : [];

    const uniqueActions =
      new Set<string>();

    workflowPlan.forEach((step) => {
      const label = String(
        step.action_type || ''
      ).trim();

      if (!label) {
        return;
      }

      /*
      * A stage marker is not an AI task.
      *
      * Example:
      * Qualified -> stage
      *
      * Send email -> AI action
      */
      const stage = String(
        step.current_stage || ''
      ).trim();

      const isStage =
        Boolean(stage) &&
        normalize(label) ===
          normalize(stage);

      if (!isStage) {
        uniqueActions.add(
          normalize(label)
        );
      }
    });

    return {
      completed,
      total:
        completed +
        uniqueActions.size,
    };
  }, [
    workflow.history,
    workflow.planned_steps,
  ]);

  const completedCount =
    aiActionsCount.completed;

  const totalCount =
    aiActionsCount.total;

  const currentStep =
    workflowSteps.find(
      (step) =>
        step.status === 'current' &&
        step.kind === 'action'
    ) || null;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount /
            totalCount) *
            100
        )
      : 0;
  
  /*
 * ------------------------------------------------------------
 * COMPLETE PIPELINE JOURNEY
 *
 * This is ONLY the visual progress structure.
 *
 * It is intentionally separate from workflowSteps.
 *
 * workflowSteps = personalized AI actions
 * journeySteps  = complete CRM journey to Deal Won
 *
 * Therefore:
 * - every lead gets the complete journey
 * - each lead's current position is different
 * - AI actions remain personalized
 * ------------------------------------------------------------
 */

  

  /*
   * ------------------------------------------------------------
   * LOADING / ERROR STATES
   * ------------------------------------------------------------
   */

  if (loadingBase) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />

        <span className="text-sm font-semibold">
          Loading personalized workflow…
        </span>
      </div>
    );
  }

  if (baseError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-destructive">
          {baseError}
        </p>

        <button
          onClick={() => loadBase()}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-bold hover:bg-secondary"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!selectedLead) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-brand-purple" />

        <p className="mt-3 text-sm font-bold text-foreground">
          No leads available
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Create a lead to generate its personalized workflow.
        </p>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * STATUS
   * ------------------------------------------------------------
   */

  const statusText =
    isWon
      ? 'Won'
      : isLost
        ? 'Lost'
        : recoveryTriggered
          ? 'Needs Attention'
          : 'On Track';

  const statusClass =
    isWon
      ? 'bg-brand-cyan/10 text-brand-cyan'
      : isLost
        ? 'bg-destructive/10 text-destructive'
        : recoveryTriggered
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'bg-brand-cyan/10 text-brand-cyan';

  return (
    <div className="space-y-4 pb-6">
      <style>{`
        @keyframes pulseWorkflowGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(124,58,237,.18);
          }

          50% {
            box-shadow: 0 0 0 7px rgba(124,58,237,.08);
          }
        }

        .workflow-current {
          animation:
            pulseWorkflowGlow
            2.4s
            ease-in-out
            infinite;
        }
      `}</style>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <Sparkles className="h-4 w-4" />
            </span>

            <h2 className="text-xl font-bold text-foreground">
              Personalized Workflow
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            AI-generated and adaptive action plan for this lead.
          </p>
        </div>

        {/* Lead search */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <button
              onClick={() =>
                setPickerOpen(
                  (open) => !open
                )
              }
              className="flex h-10 w-full items-center gap-2 rounded-lg border border-border-default bg-surface-1 px-3 text-left text-xs font-semibold text-text-primary transition-colors hover:bg-surface-2 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />

              <span className="flex-1 truncate">
                Search leads...
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                  pickerOpen
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="absolute right-0 z-30 mt-1.5 w-full overflow-x-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center gap-2 border-b border-border bg-secondary/40 p-2.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />

                  <input
                    autoFocus
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search name, company or email…"
                    className="w-full bg-transparent text-xs text-foreground outline-none"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto overflow-x-hidden">
                  {filteredLeads.length ? (
                    filteredLeads.map(
                      (lead) => (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(
                              lead.id
                            );

                            setPickerOpen(
                              false
                            );

                            setSearch('');
                          }}
                          className={`w-full border-b border-border/60 px-3.5 py-3 text-left transition last:border-0 hover:bg-secondary ${
                            lead.id ===
                            selectedLeadId
                              ? 'bg-brand-purple/5'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs font-bold text-foreground">
                              {lead.title ||
                                lead.contact_name ||
                                'Untitled lead'}
                            </span>

                            <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                              {lead.score ??
                                '—'}
                            </span>
                          </div>

                          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {lead.company_name ||
                              lead.contact_email ||
                              'No company'}
                          </div>
                        </button>
                      )
                    )
                  ) : (
                    <div className="px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
                      No leads found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => loadBase()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border-default bg-surface-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ======================================================
          LEAD / DEAL SUMMARY
      ====================================================== */}

      <section className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-purple/10 text-lg font-extrabold text-brand-purple">
              {(
                selectedLead.title ||
                selectedLead.contact_name ||
                'L'
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-bold text-foreground">
                  {selectedLead.contact_name ||
                    selectedLead.title ||
                    'Untitled lead'}
                </h3>

                {isConverted && (
                  <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-brand-cyan">
                    Deal
                  </span>
                )}
              </div>

              <p className="truncate text-xs text-muted-foreground">
                {selectedLead.company_name ||
                  'No company'}

                {selectedLead.job_title
                  ? ` · ${selectedLead.job_title}`
                  : ''}
              </p>

              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                {selectedLead.contact_email ||
                  selectedLead.contact_phone ||
                  'Contact details unavailable'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 xl:min-w-[560px]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                AI Score
              </p>

              <p className="mt-0.5 text-lg font-extrabold text-brand-purple">
                {leadHealth ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Pipeline Stage
              </p>

              <p className="mt-1 truncate text-xs font-bold text-foreground">
                {currentStage}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Value
              </p>

              <p className="mt-1 truncate text-xs font-bold text-foreground">
                {formatINR(
                  selectedDeal?.amount ??
                    selectedLead.estimated_value
                )}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </p>

              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${statusClass}`}
              >
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
        WORKFLOW PROGRESS
    ====================================================== */}

    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Workflow Progress
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Personalized AI action path for {firstName(selectedLead)}.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-extrabold text-brand-purple">
            {progress}%
          </span>

          <button
            type="button"
            onClick={() => setFullWorkflowOpen(true)}
            className="hidden sm:inline-flex items-center rounded-lg border border-border-default bg-surface-1 px-3 py-1.5 text-xs font-bold text-text-primary transition-colors cursor-pointer hover:bg-surface-2"
          >
            View full workflow
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="font-bold text-foreground">
          {completedCount} of {totalCount} tasks completed
        </span>

        {currentStep && (
          <>
            <span>·</span>

            <span>
              Current:{' '}
              <strong className="text-brand-purple">
                {currentStep.label}
              </strong>
            </span>
          </>
        )}
      </div>

      {loadingWorkflow ? (
        <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 py-8 text-xs font-semibold text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />

          Loading personalized workflow…
        </div>
      ) : workflowSteps.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/20 px-5 py-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-brand-purple" />

          <p className="mt-2 text-sm font-bold text-foreground">
            Workflow is being generated
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            PULSE will create the personalized action path for this lead.
          </p>
        </div>
      ) : (
        <div className="mt-6 pb-2">
          <div
            className="flex flex-wrap items-start justify-center gap-4"
          >
            {workflowSteps.map((step, index) => {
              const done = step.status === 'done';
              const current = step.status === 'current';
              const isStage = step.kind === 'stage';
              const isLast =
                index === workflowSteps.length - 1;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex w-[170px] shrink-0 flex-col items-center text-center">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-card transition ${
                        current
                          ? 'workflow-current border-brand-purple text-brand-purple'
                          : done
                            ? 'border-brand-cyan text-brand-cyan'
                            : 'border-border text-muted-foreground'
                      } ${
                        isStage
                          ? 'h-9 w-9'
                          : ''
                      }`}
                    >
                      {done ? (
                        <Check className="h-5 w-5" />
                      ) : current ? (
                        <Sparkles className="h-4 w-4" />
                      ) : isStage ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        <Clock3 className="h-4 w-4" />
                      )}
                    </div>

                    <p
                      className={`mt-2 max-w-[150px] text-[10px] font-bold leading-tight ${
                        current
                          ? 'text-brand-purple'
                          : done
                            ? 'text-brand-cyan'
                            : 'text-foreground'
                      }`}
                    >
                      {step.label}
                    </p>

                    <span
                      className={`mt-1 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
                        current
                          ? 'bg-brand-purple/10 text-brand-purple'
                          : done
                            ? 'bg-brand-cyan/10 text-brand-cyan'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {current
                        ? 'Current'
                        : done
                          ? 'Completed'
                          : 'Planned'}
                    </span>

                    {current && step.due_at && (
                      <span className="mt-1 text-[8px] text-muted-foreground">
                        Due {formatDate(step.due_at)}
                      </span>
                    )}
                  </div>

                  {!isLast && (
                    <div className="mt-5 h-px w-[20px] shrink-0 bg-border">
                      <div
                        className={`h-px ${
                          done
                            ? 'bg-brand-cyan'
                            : 'bg-border'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </section>

      {/* ======================================================
          COLLAPSED SUPPORTING SECTIONS
      ====================================================== */}

      <div className="space-y-2">
        {/* AI RECOMMENDATION DETAILS */}
        <details className="group rounded-xl border border-border bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-purple/10 text-brand-purple">
              <Sparkles className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">
                AI Recommendation Details
              </p>

              <p className="text-[10px] text-muted-foreground">
                View reasoning, candidate actions and score.
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>

          <div className="border-t border-border px-4 py-4">
            {loadingRec ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />

                Generating recommendation…
              </div>
            ) : rankedActions.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rankedActions
                  .slice(0, 6)
                  .map(
                    (
                      action,
                      index
                    ) => (
                      <div
                        key={`${action.label}-${index}`}
                        className="rounded-xl border border-border bg-secondary/30 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${
                              index === 0
                                ? 'bg-brand-purple text-white'
                                : 'bg-brand-purple/10 text-brand-purple'
                            }`}
                          >
                            {index + 1}
                          </span>

                          <p className="text-[10.5px] font-bold text-foreground">
                            {action.label}
                          </p>
                        </div>

                        {action.priority && (
                          <p className="mt-2 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            {action.priority}{' '}
                            priority
                          </p>
                        )}
                      </div>
                    )
                  )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No stored AI recommendation is available yet.
              </p>
            )}
          </div>
        </details>

        {/* RECOVERY WORKFLOW */}
        <details className="group rounded-xl border border-border bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                recoveryTriggered
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">
                  Recovery Workflow
                </p>

                <span
                  className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
                    recoveryTriggered
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {recoveryTriggered
                    ? 'Triggered'
                    : 'Not Triggered'}
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Adaptive path shown when the lead is not progressing on time.
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>

          <div className="border-t border-border px-4 py-4">
            {recoveryTriggered ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-bold text-foreground">
                  AI detected a possible stall.
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The recovery path will be generated from the lead's latest signals and recommendation rather than using a fixed sequence.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No recovery branch is currently required. PULSE will adapt the path when the current action becomes overdue or the recommendation detects stalled engagement.
              </p>
            )}
          </div>
        </details>

        {/* WORKFLOW HISTORY */}
        <details className="group rounded-xl border border-border bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <Clock3 className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">
                Workflow History
              </p>

              <p className="text-[10px] text-muted-foreground">
                Completed personalized actions ·{' '}
                {workflow.history.length}{' '}
                recorded
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>

          <div className="border-t border-border px-4 py-4">
            {loadingWorkflow ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />

                Loading workflow history…
              </div>
            ) : workflow.history.length ? (
              <div className="space-y-2">
                {workflow.history.map(
                  (task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/20 px-3 py-2.5"
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-cyan/10 text-brand-cyan">
                        <Check className="h-3.5 w-3.5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold text-foreground">
                          {task.action_type}
                        </p>

                        <p className="mt-0.5 text-[9.5px] text-muted-foreground">
                          {task.reasoning ||
                            'AI-recommended action recorded for this lead.'}
                        </p>
                      </div>

                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {timeAgo(
                          task.completed_at ||
                            task.created_at
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No completed workflow actions recorded for this lead yet.
              </p>
            )}
          </div>
        </details>
      </div>

      {/* ======================================================
          HOW PULSE WORKS
      ====================================================== */}

      <section className="rounded-2xl border border-brand-purple/15 bg-brand-purple/[0.035] px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-purple" />

          <p className="text-xs font-extrabold text-foreground">
            How PULSE works
          </p>
        </div>

        <div className="mt-3 grid gap-3 text-[10px] sm:grid-cols-4">
          {[
            [
              'Analyze',
              'Lead data, activity and AI signals',
            ],
            [
              'Plan',
              'Build one personalized workflow',
            ],
            [
              'Execute',
              'Surface the next best action',
            ],
            [
              'Adapt',
              'Create a recovery path when stalled',
            ],
          ].map(
            ([title, description], index) => (
              <div
                key={title}
                className="flex gap-2"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-card text-[9px] font-extrabold text-brand-purple shadow-sm">
                  {index + 1}
                </span>

                <div>
                  <p className="font-bold text-foreground">
                    {title}
                  </p>

                  <p className="mt-0.5 leading-4 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* ======================================================
          FULL WORKFLOW MODAL
      ====================================================== */}

      {fullWorkflowOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full workflow"
        >
          <div className="flex w-full max-w-4xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-purple">
                  Full workflow
                </p>

                <h3 className="mt-1 text-lg font-bold text-foreground">
                  {selectedLead.contact_name ||
                    selectedLead.title ||
                    'Lead'}
                </h3>

                <p className="text-xs text-muted-foreground">
                  Personalized actions generated for this lead.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFullWorkflowOpen(
                    false
                  )
                }
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-secondary"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {loadingWorkflow ? (
                <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  Loading workflow…
                </div>
              ) : workflowSteps.length ? (
                <div className="rounded-xl border border-border bg-secondary/20 p-5">
                  <div className="space-y-0">
                    {workflowSteps.map(
                      (step, index) => {
                        const done =
                          step.status ===
                          'done';

                        const current =
                          step.status ===
                          'current';

                        return (
                          <div
                            key={`${step.id}-full`}
                            className="relative flex gap-4"
                          >
                            {index <
                              workflowSteps.length -
                                1 && (
                              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                            )}

                            <div
                              className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 bg-card ${
                                current
                                  ? 'workflow-current border-brand-purple text-brand-purple'
                                  : done
                                    ? 'border-brand-cyan text-brand-cyan'
                                    : 'border-border text-muted-foreground'
                              }`}
                            >
                              {done ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </div>

                            <div className="pb-7 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={`text-sm font-bold ${
                                    current
                                      ? 'text-brand-purple'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {step.label}
                                </p>

                                {current && (
                                  <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-brand-purple">
                                    Current
                                  </span>
                                )}

                                {done && (
                                  <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-brand-cyan">
                                    Completed
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                                {step.reasoning}
                              </p>

                              {done &&
                                step.completed_at && (
                                  <p className="mt-1 text-[10px] text-muted-foreground">
                                    Completed{' '}
                                    {formatDate(
                                      step.completed_at
                                    )}
                                  </p>
                                )}

                              {current &&
                                step.due_at && (
                                  <p className="mt-1 text-[10px] font-semibold text-brand-purple">
                                    Due{' '}
                                    {formatDate(
                                      step.due_at
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-brand-purple" />

                  <p className="mt-2 text-sm font-bold text-foreground">
                    No workflow tasks yet
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    The personalized workflow will appear when PULSE has an AI recommendation for this lead.
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-brand-purple/15 bg-brand-purple/[0.035] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-purple">
                  Current AI recommendation
                </p>

                <p className="mt-1 text-sm font-bold text-foreground">
                  {topAction}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {workflow.current_task
                    ?.reasoning ||
                    recItem?.reason ||
                    'PULSE will use the latest CRM signals to determine the next best action.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}