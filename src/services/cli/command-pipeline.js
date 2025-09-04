/**
 * Command Pipeline System for Enhanced CLI
 * Enables command chaining, batch operations, and advanced workflow processing
 */

export class CommandPipeline {
  constructor(cli) {
    this.cli = cli;
    this.pipelines = new Map();
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.pipelineHistory = [];
    this.batchOperations = new Map();

    // Configuration
    this.config = {
      maxConcurrentJobs: 3,
      maxPipelineSteps: 20,
      pipelineTimeout: 300000, // 5 minutes
      enableBackgroundExecution: true,
      enableBatchOperations: true
    };
  }

  /**
   * Initialize the pipeline system
   */
  async initialize() {
    console.log('🔗 Command Pipeline System initializing...');

    // Start job processing
    this.startJobProcessor();

    // Load saved pipelines
    await this.loadSavedPipelines();

    console.log('✅ Command Pipeline System initialized');
  }

  /**
   * Create a new command pipeline
   */
  createPipeline(name, description = '') {
    const pipeline = {
      id: crypto.randomUUID(),
      name,
      description,
      steps: [],
      createdAt: new Date().toISOString(),
      metadata: {
        totalExecutions: 0,
        averageExecutionTime: 0,
        lastExecution: null,
        successRate: 0
      }
    };

    this.pipelines.set(pipeline.id, pipeline);
    return pipeline.id;
  }

  /**
   * Add a step to a pipeline
   */
  addStep(pipelineId, step) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    if (pipeline.steps.length >= this.config.maxPipelineSteps) {
      throw new Error(`Maximum pipeline steps (${this.config.maxPipelineSteps}) exceeded`);
    }

    const stepDefinition = {
      id: crypto.randomUUID(),
      type: step.type || 'command', // command, script, conditional
      command: step.command,
      args: step.args || [],
      options: step.options || {},
      condition: step.condition, // for conditional steps
      onSuccess: step.onSuccess, // next step on success
      onFailure: step.onFailure, // next step on failure
      timeout: step.timeout || 30000,
      retryCount: step.retryCount || 0,
      retryDelay: step.retryDelay || 1000,
      addedAt: new Date().toISOString()
    };

    pipeline.steps.push(stepDefinition);
    return stepDefinition.id;
  }

  /**
   * Execute a pipeline
   */
  async executePipeline(pipelineId, context = {}, options = {}) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Create execution context
    const executionId = crypto.randomUUID();
    const executionContext = {
      id: executionId,
      pipelineId,
      startTime: new Date().toISOString(),
      steps: [],
      variables: {},
      results: {},
      errors: [],
      status: 'running',
      ...context
    };

    // Execute in background if requested
    if (options.background) {
      return this.executeInBackground(executionId, pipeline, executionContext, options);
    }

    // Execute synchronously
    return await this.executePipelineSteps(pipeline, executionContext);
  }

  /**
   * Execute pipeline steps synchronously
   */
  async executePipelineSteps(pipeline, executionContext) {
    const startTime = performance.now();
    let currentStepIndex = 0;
    let lastResult = null;

    try {
      while (currentStepIndex < pipeline.steps.length) {
        const step = pipeline.steps[currentStepIndex];
        const stepStartTime = performance.now();

        // Check if step should execute based on conditions
        if (step.condition && !this.evaluateCondition(step.condition, executionContext)) {
          currentStepIndex++;
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, executionContext, lastResult);
        executionContext.steps.push({
          stepId: step.id,
          command: step.command,
          result: stepResult.success,
          executionTime: performance.now() - stepStartTime,
          timestamp: new Date().toISOString()
        });

        // Store result for next step
        lastResult = stepResult;
        executionContext.results[step.id] = stepResult;

        // Handle step result
        if (!stepResult.success) {
          executionContext.errors.push({
            step: step.id,
            error: stepResult.error,
            timestamp: new Date().toISOString()
          });

          // Check retry logic
          if (step.retryCount > 0 && executionContext.retryCount < step.retryCount) {
            executionContext.retryCount++;
            await this.delay(step.retryDelay);
            continue; // Retry same step
          }

          // Move to failure step if defined
          if (step.onFailure) {
            currentStepIndex = this.findStepIndex(pipeline, step.onFailure);
            continue;
          }

          // Pipeline failed
          break;
        }

        // Move to success step or next step
        if (step.onSuccess) {
          currentStepIndex = this.findStepIndex(pipeline, step.onSuccess);
        } else {
          currentStepIndex++;
        }
      }

      // Update pipeline metadata
      const totalTime = performance.now() - startTime;
      this.updatePipelineMetrics(pipeline, executionContext, totalTime);

      executionContext.status =
        executionContext.errors.length > 0 ? 'completed_with_errors' : 'completed';
      executionContext.endTime = new Date().toISOString();
      executionContext.totalExecutionTime = totalTime;

      return executionContext;
    } catch (error) {
      executionContext.status = 'failed';
      executionContext.endTime = new Date().toISOString();
      executionContext.error = error.message;
      executionContext.totalExecutionTime = performance.now() - startTime;

      throw error;
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, executionContext, previousResult) {
    try {
      let command = step.command;
      let args = [...step.args];

      // Substitute variables
      command = this.substituteVariables(command, executionContext);
      args = args.map(arg => this.substituteVariables(arg, executionContext));

      // Include previous result if available
      if (previousResult && step.options.usePreviousResult) {
        if (step.options.passResultAs) {
          executionContext.variables[step.options.passResultAs] = previousResult.data;
        } else {
          args.push(JSON.stringify(previousResult.data));
        }
      }

      // Execute command
      const result = await this.cli.executeCommand(
        `${command} ${args.join(' ')}`.trim(),
        executionContext
      );

      // Store result in variables if requested
      if (step.options.storeResultAs) {
        executionContext.variables[step.options.storeResultAs] = result.data;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        step: step.id
      };
    }
  }

  /**
   * Execute pipeline in background
   */
  async executeInBackground(executionId, pipeline, executionContext, options) {
    // Add to job queue
    const job = {
      id: executionId,
      type: 'pipeline',
      pipeline,
      executionContext,
      options,
      status: 'queued',
      createdAt: new Date().toISOString(),
      onComplete: options.onComplete,
      onProgress: options.onProgress
    };

    this.jobQueue.push(job);
    this.activeJobs.set(executionId, job);

    // Notify progress callback
    if (options.onProgress) {
      options.onProgress({
        jobId: executionId,
        status: 'queued',
        progress: 0
      });
    }

    return {
      jobId: executionId,
      status: 'queued',
      message: 'Pipeline job queued for background execution'
    };
  }

  /**
   * Start job processor for background tasks
   */
  startJobProcessor() {
    setInterval(() => {
      this.processJobQueue();
    }, 1000); // Process every second
  }

  /**
   * Process queued jobs
   */
  async processJobQueue() {
    if (this.jobQueue.length === 0) return;

    // Get available slots
    const activeJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'running');

    if (activeJobs.length >= this.config.maxConcurrentJobs) return;

    // Start next job
    const nextJob = this.jobQueue.shift();
    if (!nextJob) return;

    nextJob.status = 'running';
    nextJob.startedAt = new Date().toISOString();

    try {
      const result = await this.executePipelineSteps(nextJob.pipeline, nextJob.executionContext);

      nextJob.status = 'completed';
      nextJob.completedAt = new Date().toISOString();
      nextJob.result = result;

      // Notify completion callback
      if (nextJob.onComplete) {
        nextJob.onComplete(result);
      }
    } catch (error) {
      nextJob.status = 'failed';
      nextJob.completedAt = new Date().toISOString();
      nextJob.error = error.message;

      // Notify completion callback with error
      if (nextJob.onComplete) {
        nextJob.onComplete({ success: false, error: error.message });
      }
    }

    // Clean up old jobs
    this.cleanupOldJobs();
  }

  /**
   * Parse command string into pipeline
   */
  async parseAndExecutePipeline(commandString, context = {}) {
    const pipeline = this.parseCommandString(commandString);

    if (pipeline.steps.length === 1) {
      // Single command, execute directly
      return await this.cli.executeCommand(pipeline.steps[0].command, context);
    }

    // Create and execute pipeline
    const pipelineId = this.createPipeline('parsed-pipeline');
    pipeline.steps.forEach(step => {
      this.addStep(pipelineId, step);
    });

    return await this.executePipeline(pipelineId, context);
  }

  /**
   * Parse command string with operators
   */
  parseCommandString(commandString) {
    const pipeline = {
      steps: [],
      operators: []
    };

    // Helper function to parse individual command
    const parseSingleCommand = cmdString => {
      const trimmed = cmdString.trim();
      const parts = trimmed.split(/\s+/);

      if (parts.length === 0) return null;

      // Extract command and arguments
      const command = parts[0];
      const args = parts.slice(1);

      // Parse options (simple implementation)
      const options = {};
      const positionalArgs = [];

      for (const arg of args) {
        if (arg.startsWith('--')) {
          const [key, value] = arg.substring(2).split('=');
          options[key] = value || true;
        } else if (arg.startsWith('-')) {
          const key = arg.substring(1);
          options[key] = true;
        } else {
          positionalArgs.push(arg);
        }
      }

      return {
        type: 'command',
        command,
        args: positionalArgs,
        options
      };
    };

    // Handle pipes (|)
    if (commandString.includes('|')) {
      const parts = commandString.split('|').map(part => part.trim());
      pipeline.steps = parts.map(parseSingleCommand).filter(step => step !== null);
      pipeline.operators = new Array(pipeline.steps.length - 1).fill('pipe');
      return pipeline;
    }

    // Handle sequential execution (&&)
    if (commandString.includes('&&')) {
      const parts = commandString.split('&&').map(part => part.trim());
      pipeline.steps = parts.map(parseSingleCommand).filter(step => step !== null);
      pipeline.operators = new Array(pipeline.steps.length - 1).fill('sequential');
      return pipeline;
    }

    // Handle conditional execution (||)
    if (commandString.includes('||')) {
      const parts = commandString.split('||').map(part => part.trim());
      pipeline.steps = parts.map(parseSingleCommand).filter(step => step !== null);
      pipeline.operators = new Array(pipeline.steps.length - 1).fill('conditional');
      return pipeline;
    }

    // Single command
    const singleCommand = parseSingleCommand(commandString);
    if (singleCommand) {
      pipeline.steps = [singleCommand];
    } else {
      pipeline.steps = [
        {
          type: 'command',
          command: commandString.trim(),
          args: [],
          options: {}
        }
      ];
    }

    return pipeline;
  }

  /**
   * Evaluate condition for conditional steps
   */
  evaluateCondition(condition, executionContext) {
    try {
      // Simple variable-based conditions
      if (typeof condition === 'string') {
        return executionContext.variables[condition] || executionContext.results[condition];
      }

      // Function-based conditions
      if (typeof condition === 'function') {
        return condition(executionContext);
      }

      return true;
    } catch (error) {
      console.warn('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Substitute variables in command/args
   */
  substituteVariables(text, executionContext) {
    if (typeof text !== 'string') return text;

    // Replace ${variable} syntax
    return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = executionContext.variables[varName];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Find step index by ID
   */
  findStepIndex(pipeline, stepId) {
    return pipeline.steps.findIndex(step => step.id === stepId);
  }

  /**
   * Update pipeline execution metrics
   */
  updatePipelineMetrics(pipeline, executionContext, executionTime) {
    const metadata = pipeline.metadata;
    const wasSuccessful = executionContext.errors.length === 0;

    metadata.totalExecutions++;
    metadata.lastExecution = executionContext.endTime;

    // Update average execution time
    const totalTime =
      metadata.averageExecutionTime * (metadata.totalExecutions - 1) + executionTime;
    metadata.averageExecutionTime = totalTime / metadata.totalExecutions;

    // Update success rate
    const successfulRuns = wasSuccessful ? 1 : 0;
    const previousSuccessful = (metadata.successRate * (metadata.totalExecutions - 1)) / 100;
    metadata.successRate = ((previousSuccessful + successfulRuns) / metadata.totalExecutions) * 100;
  }

  /**
   * Create batch operation
   */
  async createBatchOperation(operations, options = {}) {
    const batchId = crypto.randomUUID();
    const batch = {
      id: batchId,
      operations,
      status: 'created',
      createdAt: new Date().toISOString(),
      options: {
        parallel: options.parallel || false,
        continueOnError: options.continueOnError || false,
        ...options
      },
      results: [],
      errors: []
    };

    // Create individual pipelines for each operation
    batch.pipelines = await Promise.all(
      operations.map(async (operation, index) => {
        const pipelineId = this.createPipeline(`batch-${batchId}-${index}`, operation.description);
        this.addStep(pipelineId, {
          type: 'command',
          command: operation.command,
          args: operation.args || [],
          options: operation.options || {}
        });
        return pipelineId;
      })
    );

    // Store the batch operation
    this.batchOperations.set(batchId, batch);

    return batchId;
  }

  /**
   * Execute batch operation
   */
  async executeBatchOperation(batchId, context = {}) {
    const batch = await this.getBatchOperation(batchId);
    if (!batch) {
      throw new Error(`Batch operation ${batchId} not found`);
    }

    batch.status = 'running';
    batch.startedAt = new Date().toISOString();

    try {
      const results = [];

      if (batch.options.parallel) {
        // Execute in parallel
        const promises = batch.pipelines.map(pipelineId =>
          this.executePipeline(pipelineId, context, { background: false })
        );
        results.push(...(await Promise.allSettled(promises)));
      } else {
        // Execute sequentially
        for (const pipelineId of batch.pipelines) {
          try {
            const result = await this.executePipeline(pipelineId, context);
            results.push({ status: 'fulfilled', value: result });

            if (!batch.options.continueOnError && !result.status.includes('completed')) {
              break;
            }
          } catch (error) {
            results.push({ status: 'rejected', reason: error });

            if (!batch.options.continueOnError) {
              break;
            }
          }
        }
      }

      batch.status = 'completed';
      batch.completedAt = new Date().toISOString();
      batch.results = results;

      return batch;
    } catch (error) {
      batch.status = 'failed';
      batch.completedAt = new Date().toISOString();
      batch.error = error.message;

      throw error;
    }
  }

  /**
   * Get batch operation status
   */
  getBatchOperation(batchId) {
    return this.batchOperations.get(batchId) || null;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'cancelled';
      job.cancelledAt = new Date().toISOString();

      // Remove from queue if pending
      const queueIndex = this.jobQueue.findIndex(j => j.id === jobId);
      if (queueIndex >= 0) {
        this.jobQueue.splice(queueIndex, 1);
      }

      return true;
    }
    return false;
  }

  /**
   * List active jobs
   */
  listActiveJobs() {
    return Array.from(this.activeJobs.values()).map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      pipelineName: job.pipeline?.name
    }));
  }

  /**
   * Clean up old completed jobs
   */
  cleanupOldJobs() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const [jobId, job] of this.activeJobs) {
      if (job.completedAt && new Date(job.completedAt).getTime() < cutoffTime) {
        this.activeJobs.delete(jobId);
      }
    }
  }

  /**
   * Save pipelines to storage
   */
  async savePipelines() {
    try {
      const pipelinesToSave = Array.from(this.pipelines.values()).map(pipeline => ({
        ...pipeline,
        steps: pipeline.steps.map(step => ({
          ...step,
          // Remove functions that can't be serialized
          condition:
            typeof step.condition === 'function' ? step.condition.toString() : step.condition,
          onSuccess:
            typeof step.onSuccess === 'function' ? step.onSuccess.toString() : step.onSuccess,
          onFailure:
            typeof step.onFailure === 'function' ? step.onFailure.toString() : step.onFailure
        }))
      }));

      localStorage.setItem('cli-pipelines', JSON.stringify(pipelinesToSave));
    } catch (error) {
      console.warn('Failed to save pipelines:', error.message);
    }
  }

  /**
   * Load saved pipelines
   */
  async loadSavedPipelines() {
    try {
      const saved = localStorage.getItem('cli-pipelines');
      if (saved) {
        const pipelines = JSON.parse(saved);
        pipelines.forEach(pipeline => {
          this.pipelines.set(pipeline.id, pipeline);
        });
        console.log(`📋 Loaded ${pipelines.length} saved pipelines`);
      }
    } catch (error) {
      console.warn('Failed to load saved pipelines:', error.message);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats() {
    const stats = {
      totalPipelines: this.pipelines.size,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.length,
      totalExecutions: 0,
      averageExecutionTime: 0
    };

    // Aggregate pipeline metrics
    for (const pipeline of this.pipelines.values()) {
      stats.totalExecutions += pipeline.metadata.totalExecutions;
      stats.averageExecutionTime += pipeline.metadata.averageExecutionTime;
    }

    if (this.pipelines.size > 0) {
      stats.averageExecutionTime /= this.pipelines.size;
    }

    return stats;
  }

  /**
   * Destroy pipeline system
   */
  async destroy() {
    // Save pipelines before destroying
    await this.savePipelines();

    // Cancel all active jobs
    for (const jobId of this.activeJobs.keys()) {
      this.cancelJob(jobId);
    }

    // Clear all data
    this.pipelines.clear();
    this.activeJobs.clear();
    this.jobQueue = [];
    this.pipelineHistory = [];

    console.log('🧹 Command Pipeline System destroyed');
  }
}
