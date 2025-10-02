'use client';

import { useState, useMemo, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { Loader } from '@/components/ai-elements/loader'
import { Button } from '@/components/ui/button2'
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function Page() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>();
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0); // Index of file to analyze
    const [extraInfo, setExtraInfo] = useState<string>(''); // Extra information for workflow generation
    const [generatedSteps, setGeneratedSteps] = useState<string[]>([])
    const [isGeneratingSteps, setIsGeneratingSteps] = useState(false)
    const [stepsGenerationError, setStepsGenerationError] = useState<string | null>(null)
    const [workflowConfirmed, setWorkflowConfirmed] = useState<boolean>(false)
    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
    const [editingStepText, setEditingStepText] = useState<string>('')
    const [output, setOutput] = useState(``)
    const [workflowOutput, setWorkflowOutput] = useState(``)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
    const [streamStatus, setStreamStatus] = useState<'idle' | 'processing' | 'analyzing' | 'complete' | 'error'>('idle');
    const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
    const [hasSeenHyperbrowserInitiated, setHasSeenHyperbrowserInitiated] = useState(false);
    
    // Accordion state for sections
    const [expandedSections, setExpandedSections] = useState<{
        analysis: boolean;
        steps: boolean;
        workflow: boolean;
    }>({
        analysis: false,
        steps: false,
        workflow: false
    });
    
    // Modal state for video viewing
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [modalVideoIndex, setModalVideoIndex] = useState<number>(0);
    
    const startStream = async () => {
        if (selectedFiles.length === 0) return;
        
        setIsStreaming(true);
        setStreamStatus('processing');
        setOutput('');
        setStepsGenerationError(null);
        setGeneratedSteps([]);
        setWorkflowConfirmed(false);
        setWorkflowOutput('');
        setWorkflowStatus('idle');
        
        try {
        const formData = new FormData();
        // Process the selected file for analysis
        formData.append('file', selectedFiles[selectedFileIndex] as Blob);
        
        setStreamStatus('analyzing');
        const res = await fetch('/api/twelvelabs', {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const result = await reader?.read();
            if (!result || result.done) break;
            
            const chunk = decoder.decode(result.value);
            fullResponse += chunk;
            setOutput(prev => prev + chunk);
        }
        
        setStreamStatus('complete');
        
        // Step 2: Turn action steps into object
        setIsGeneratingSteps(true);
        setStepsGenerationError(null);
        try {
            // The TwelveLabs response is text, so submit it directly with extra info
            const stepsResponse = await fetch('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    analysis: fullResponse,
                    extraInfo: extraInfo.trim()
                })
            })
            
            console.log('Steps response:', stepsResponse);
            
            if (!stepsResponse.ok) {
                throw new Error(`HTTP error! status: ${stepsResponse.status}`);
            }
            
            const steps = await stepsResponse.json();
            console.log('Steps:', steps);
            
            // Check if the response contains an error
            if (steps.error) {
                throw new Error(steps.error);
            }
            
            setGeneratedSteps(Array.isArray(steps) ? steps : []);
        } catch (error) {
            console.error('Error generating steps:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setStepsGenerationError(errorMessage);
            setGeneratedSteps([]);
        } finally {
            setIsGeneratingSteps(false);
        }

        } catch (error) {
            console.error('Streaming error:', error);
            setStreamStatus('error');
            setOutput(prev => prev + `\n\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsStreaming(false);
        }

    }

    // Create stable blob URLs for all selected files
    const videoBlobUrls = useMemo(() => {
        return selectedFiles.map(file => URL.createObjectURL(file));
    }, [selectedFiles])

    // Cleanup blob URLs when component unmounts or files change
    useEffect(() => {
        return () => {
            videoBlobUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [videoBlobUrls])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            // If we already have files, append new ones; otherwise replace
            if (selectedFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...files]);
            } else {
                setSelectedFiles(files);
                setSelectedFileIndex(0); // Select first file by default
            }
            setSelectedVideoId(undefined); // Clear library selection when uploading new files
        }
    }

    const removeFile = (indexToRemove: number) => {
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        // Adjust selected index if needed
        if (indexToRemove === selectedFileIndex) {
            setSelectedFileIndex(0); // Reset to first file
        } else if (indexToRemove < selectedFileIndex) {
            setSelectedFileIndex(prev => prev - 1); // Adjust index
        }
    };

    const selectFileForAnalysis = (index: number) => {
        setSelectedFileIndex(index);
    };

    const openVideoModal = (index: number) => {
        setModalVideoIndex(index);
        setIsVideoModalOpen(true);
    };

    const closeVideoModal = () => {
        setIsVideoModalOpen(false);
    };

    const toggleSection = (section: 'analysis' | 'steps' | 'workflow') => {
        // Check if section can be opened based on completion status
        const canOpenAnalysis = streamStatus === 'complete';
        const canOpenSteps = (generatedSteps.length > 0 || !!stepsGenerationError) && !isGeneratingSteps;
        const canOpenWorkflow = workflowStatus !== 'idle' || isWorkflowRunning || !!workflowOutput;
        
        let canOpen = false;
        switch (section) {
            case 'analysis':
                canOpen = canOpenAnalysis;
                break;
            case 'steps':
                canOpen = canOpenSteps;
                break;
            case 'workflow':
                canOpen = canOpenWorkflow;
                break;
        }
        
        // Only toggle if the section can be opened
        if (canOpen) {
            setExpandedSections(prev => ({
                ...prev,
                [section]: !prev[section]
            }));
        }
    };

    // Workflow execution function
    const runWorkflow = async () => {
        if (generatedSteps.length === 0) return;
        
        setIsWorkflowRunning(true);
        setWorkflowStatus('running');
        setWorkflowOutput('');
        setHasSeenHyperbrowserInitiated(false); // Reset the flag for new workflow
        
        try {
            // Flatten the steps in case they come as nested arrays
            const flattenedSteps = generatedSteps.map((step: any) => {
                // If step is an array, take the first element, otherwise use as is
                return Array.isArray(step) ? step[0] : step;
            }).filter((step: any) => typeof step === 'string' && step.trim().length > 0);
            
            console.log('Original steps:', generatedSteps);
            console.log('Flattened steps:', flattenedSteps);
            
            const workflowResponse = await fetch('/api/hyperbrowser-browseruse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    steps: flattenedSteps,
                }),
            });
            
            console.log('Workflow response:', workflowResponse);

            if (!workflowResponse.ok) {
                throw new Error(`HTTP error! status: ${workflowResponse.status}`);
            }

            // Handle streaming response
            const reader = workflowResponse.body?.getReader();
            const decoder = new TextDecoder();
            let currentWorkflowOutput = '';

            while (true) {
                const result = await reader?.read();
                if (!result || result.done) break;
                
                const chunk = decoder.decode(result.value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Hyperbrowser Browser Use stream data:', data);
                            
                            // Skip the first initialization message
                            if (data.message && data.message.toLowerCase().includes('initializing hyperbrowser browser use') && !hasSeenHyperbrowserInitiated) {
                                setHasSeenHyperbrowserInitiated(true);
                                continue; // Skip this message
                            }
                            
                            // Update workflow output with streaming data
                            const formattedMessage = `[${data.type}] ${data.message}\n`;
                            currentWorkflowOutput += formattedMessage;
                            setWorkflowOutput(prev => prev + formattedMessage);
                            
                            // Log specific workflow events
                            if (data.type === 'step') {
                                console.log('Hyperbrowser Browser Use step:', data.stepData);
                            } else if (data.type === 'agent_output') {
                                console.log('Agent output:', data.data);
                            } else if (data.type === 'task') {
                                console.log('Task description:', data.taskDescription);
                            } else if (data.type === 'complete') {
                                console.log('Hyperbrowser Browser Use completed:', data.output);
                                setWorkflowStatus('complete');
                            } else if (data.type === 'error') {
                                console.error('Hyperbrowser Browser Use error:', data.error);
                                setWorkflowStatus('error');
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Hyperbrowser Browser Use execution error:', error);
            setWorkflowStatus('error');
            setWorkflowOutput(prev => prev + `\n\n❌ Hyperbrowser Browser Use Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsWorkflowRunning(false);
        }
    };

    // Step editing functions
    const startEditingStep = (index: number) => {
        setEditingStepIndex(index);
        setEditingStepText(generatedSteps[index]);
    };

    const cancelEditingStep = () => {
        setEditingStepIndex(null);
        setEditingStepText('');
    };

    const saveEditingStep = () => {
        if (editingStepIndex !== null && editingStepText.trim()) {
            const updatedSteps = [...generatedSteps];
            updatedSteps[editingStepIndex] = editingStepText.trim();
            setGeneratedSteps(updatedSteps);
            setEditingStepIndex(null);
            setEditingStepText('');
        }
    };

    const deleteStep = (index: number) => {
        const updatedSteps = generatedSteps.filter((_, i) => i !== index);
        setGeneratedSteps(updatedSteps);
        // Cancel editing if we're deleting the step being edited
        if (editingStepIndex === index) {
            setEditingStepIndex(null);
            setEditingStepText('');
        } else if (editingStepIndex !== null && editingStepIndex > index) {
            // Adjust editing index if needed
            setEditingStepIndex(editingStepIndex - 1);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#171717] text-white">
        <div className="flex flex-row-reverse flex-1 p-2">
            <div className="bg-[#111113] w-full rounded-4xl">
                {/* File Input Component for AI Agent */}
                <div className='flex justify-center w-full p-6'>
                    <div className="mx-auto flex flex-col w-full max-w-lg gap-y-6 font-geist">
                        {/* File Input Section */}
                        <div className='relative'>
                            <div className='flex w-full justify-center items-center gap-4 bg-[#171717] p-8 rounded-2xl border border-gray-600 hover:border-gray-500 transition-border duration-200'>
                                
                                <div className="relative flex flex-col items-center gap-4 flex-grow z-10">
                                    {selectedFiles.length > 0 ? (
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col items-center gap-6 w-full"
                                        >
                                            {/* Multiple Files Header */}
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${selectedVideoId ? 'bg-purple-400' : 'bg-green-400'}`} />
                                                    <span className="text-white font-medium">
                                                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                                                    </span>
                                                    {selectedVideoId && (
                                                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                                                            From Library
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Action buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => document.getElementById('file-input')?.click()}
                                                        className="border border-gray-600 p-2 bg-[#111113] text-white hover:bg-[#2A2A2A] rounded-lg shadow-sm cursor-pointer hover:cursor-pointer"
                                                        title="Add More Videos"
                                                    >
                                                        <Icon className="text-gray-700" type="upload" size="sm" />
                                                    </button>
                                                    {selectedVideoId && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFiles([]);
                                                            setSelectedVideoId(undefined);
                                                            setSelectedFileIndex(0);
                                                        }}
                                                        className="p-2 bg-[#FAFAFA] text-[#18181B] hover:bg-[#E4E4E7] rounded-lg transition-colors shadow-sm cursor-pointer hover:cursor-pointer"
                                                        title="Back to Library"
                                                    >
                                                        <Icon type="refresh" size="sm" className="text-gray-700" />
                                                    </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Files Grid - Block Components */}
                                            <div className="w-full max-w-4xl">
                                                <div className={`grid gap-3 ${
                                                    selectedFiles.length === 1 ? 'grid-cols-1' : 
                                                    selectedFiles.length <= 3 ? 'grid-cols-1' : 
                                                    'grid-cols-1 sm:grid-cols-2'
                                                }`}>
                                                    {selectedFiles.map((file, index) => {
                                                        const isSelected = index === selectedFileIndex;
                                                        return (
                                                        <motion.div
                                                            key={`${file.name}-${index}`}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            onClick={() => selectFileForAnalysis(index)}
                                                            className={`relative rounded-xl border group cursor-pointer transition-all duration-200 ${
                                                                isSelected 
                                                                    ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/50' 
                                                                    : 'bg-gray-800/50 border-gray-600/50 hover:border-gray-500 hover:bg-gray-800/70'
                                                            }`}
                                                        >
                                                            {/* Block Content */}
                                                            <div className="p-4 flex items-center gap-4">
                                                                {/* Video Icon and Info */}
                                                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                                                    <div className="p-3 bg-gray-700/50 rounded-lg flex-shrink-0">
                                                                        <Icon type="sheet" size="lg" className="text-gray-700" />
                                                                    </div>
                                                                    <div className="flex-grow min-w-0">
                                                                        <div className="text-white font-medium text-sm truncate mb-1">
                                                                            {file.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-400">
                                                                            {(file.size / 1024 / 1024).toFixed(2)} MB • Video File
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openVideoModal(index);
                                                                        }}
                                                                        className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors cursor-pointer hover:cursor-pointer"
                                                                        title="View Video"
                                                                    >
                                                                        <Icon type="play" size="sm" className="text-gray-700" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeFile(index);
                                                                        }}
                                                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer hover:cursor-pointer"
                                                                        title="Remove Video"
                                                                    >
                                                                        <Icon type="trash" size="sm" className="text-gray-700" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-[#171717] rounded-full border border-gray-600">
                                                    <Icon type="upload" size="lg" className="text-gray-700" />
                                                </div>
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <span className="text-lg font-medium text-white">
                                                        Drop your screen recordings here
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        or click to browse • Select multiple files from library above or upload new
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-1 h-1 bg-gray-500 rounded-full" />
                                                        <span className="text-xs text-gray-500">Max file size: 100MB</span>
                                                        <div className="w-1 h-1 bg-gray-500 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* File input overlay only when no files are selected */}
                                            <input
                                                type="file"
                                                id="file-input"
                                                accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            />
                                        </>
                                    )}
                                    
                                    {/* Hidden file input for programmatic access when videos are selected */}
                                    {selectedFiles.length > 0 && (
                                        <input
                                            type="file"
                                            id="file-input"
                                            accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Extra Info Input */}
                        <div className="mb-2">
                            <label htmlFor="extra-info" className="block text-sm font-medium text-gray-300 mb-2">
                                Extra Information (Optional)
                            </label>
                            <textarea
                                id="extra-info"
                                value={extraInfo}
                                onChange={(e) => setExtraInfo(e.target.value)}
                                placeholder="Add any additional context or specific requirements for the workflow generation..."
                                className="w-full px-4 py-3 bg-[#171717] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-colors"
                                rows={3}
                            />
                        </div>

                        {/* Run Agent Button */}
                        <div className="mb-6">
                            <Button
                                onClick={startStream}
                                disabled={selectedFiles.length === 0 || isStreaming}
                                className="w-full px-6 py-2 bg-[#FAFAFA] text-[#18181B] hover:bg-[#E4E4E7] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer hover:cursor-pointer justify-center"
                            >
                                {isStreaming ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size={14} />
                                        <span>Running...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Icon type="play" size="sm" className="text-gray-700" />
                                        <span>Run Agent</span>
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Video Analysis Section - Accordion */}
                        {(output || streamStatus !== 'idle') && (
                        <div className="mb-4">
                            <div className="border border-gray-700 rounded-xl overflow-hidden bg-[#171717]">
                                <button 
                                    onClick={() => toggleSection('analysis')}
                                    disabled={streamStatus !== 'complete'}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                                        streamStatus !== 'complete' 
                                            ? 'bg-gray-800/20 cursor-not-allowed opacity-60' 
                                            : 'bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${
                                            streamStatus === 'complete' ? 'bg-gray-600/20' : 
                                            streamStatus === 'processing' || streamStatus === 'analyzing' ? 'bg-gray-600/20' : 
                                            streamStatus === 'error' ? 'bg-gray-600/20' : 'bg-gray-600/20'
                                        }`}>
                                            <Icon type="sheet" size="sm" className={`transition-colors ${
                                                streamStatus === 'complete' ? 'text-white' : 
                                                streamStatus === 'processing' || streamStatus === 'analyzing' ? 'text-white' : 
                                                streamStatus === 'error' ? 'text-white' : 'text-gray-700'
                                            }`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-white">Video Analysis</h3>
                                            <p className="text-sm text-gray-400">
                                                {streamStatus === 'idle' && 'Extract workflow from screen recording'}
                                                {streamStatus === 'processing' && 'Preparing video for analysis...'}
                                                {streamStatus === 'analyzing' && 'Analyzing video content...'}
                                                {streamStatus === 'complete' && `Analysis complete • ${output ? output.split(' ').length : 0} words`}
                                                {streamStatus === 'error' && 'Analysis failed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {streamStatus === 'complete' && <Icon type="check" size="sm" className="text-white" />}
                                        {(streamStatus === 'processing' || streamStatus === 'analyzing') && <Loader size={16} />}
                                        {streamStatus === 'error' && <Icon type="x" size="sm" className="text-white" />}
                                        <Icon type={expandedSections.analysis ? 'chevron-up' : 'chevron-down'} size="sm" className="text-gray-700" />
                                    </div>
                                </button>
                                
                                <AnimatePresence mode="wait">
                                    {expandedSections.analysis && (
                                        <motion.div
                                            key="analysis-content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ 
                                                duration: 0.3,
                                                ease: [0.04, 0.62, 0.23, 0.98]
                                            }}
                                            className="border-t border-gray-700"
                                        >
                                        <div className="p-6">
                                            {output ? (
                                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                                                    <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">
                                                        {output}
                                                        {isStreaming && (
                                                            <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Icon type="sheet" size="lg" className="mx-auto mb-2 text-gray-700" />
                                                    <p>No analysis results yet. Click "Run Agent" to start.</p>
                                                </div>
                                            )}
                                        </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        )}

                        {/* Structured Steps Section - Accordion */}
                        {(generatedSteps.length > 0 || isGeneratingSteps || stepsGenerationError) && (
                        <div className="mb-4">
                            <div className="border border-gray-700 rounded-xl overflow-hidden bg-[#171717]">
                                <button 
                                    onClick={() => toggleSection('steps')}
                                    disabled={!((generatedSteps.length > 0 || stepsGenerationError) && !isGeneratingSteps)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                                        !((generatedSteps.length > 0 || stepsGenerationError) && !isGeneratingSteps)
                                            ? 'bg-gray-800/20 cursor-not-allowed opacity-60' 
                                            : 'bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${
                                            generatedSteps.length > 0 && !isGeneratingSteps ? 'bg-gray-600/20' : 
                                            stepsGenerationError ? 'bg-red-600/20' :
                                            isGeneratingSteps ? 'bg-gray-600/20' : 'bg-gray-600/20'
                                        }`}>
                                            <Icon type="sheet" size="sm" className={`transition-colors ${
                                                generatedSteps.length > 0 && !isGeneratingSteps ? 'text-white' : 
                                                stepsGenerationError ? 'text-red-400' :
                                                isGeneratingSteps ? 'text-white' : 'text-gray-700'
                                            }`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-white">Workflow Steps</h3>
                                            <p className="text-sm text-gray-400">
                                                {!generatedSteps.length && !isGeneratingSteps && !stepsGenerationError && 'AI-structured automation steps'}
                                                {isGeneratingSteps && 'Generating workflow steps...'}
                                                {generatedSteps.length > 0 && !isGeneratingSteps && `${generatedSteps.length} steps generated`}
                                                {stepsGenerationError && 'Step generation failed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {generatedSteps.length > 0 && !isGeneratingSteps && <Icon type="check" size="sm" className="text-white" />}
                                        {stepsGenerationError && <Icon type="x" size="sm" className="text-red-400" />}
                                        {isGeneratingSteps && <Loader size={16} />}
                                        <Icon type={expandedSections.steps ? 'chevron-up' : 'chevron-down'} size="sm" className="text-gray-700" />
                                    </div>
                                </button>
                                
                                <AnimatePresence mode="wait">
                                    {expandedSections.steps && (
                                        <motion.div
                                            key="steps-content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ 
                                                duration: 0.3,
                                                ease: [0.04, 0.62, 0.23, 0.98]
                                            }}
                                            className="border-t border-gray-700"
                                        >
                                        <div className="p-6">
                                            {stepsGenerationError ? (
                                                <div className="text-center py-8">
                                                    <Icon type="x" size="lg" className="mx-auto mb-2 text-red-400" />
                                                    <p className="text-red-400 mb-2">Failed to generate workflow steps</p>
                                                    <p className="text-sm text-gray-400">{stepsGenerationError}</p>
                                                    <button
                                                        onClick={() => {
                                                            setStepsGenerationError(null);
                                                            // You could add a retry function here
                                                        }}
                                                        className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            ) : generatedSteps.length > 0 ? (
                                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                                                    <div className="space-y-3">
                                                        {generatedSteps.map((step, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.2, delay: index * 0.1 }}
                                                                className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 group hover:bg-gray-800/40 transition-colors"
                                                            >
                                                                <div className="flex items-center justify-center w-6 h-6 bg-gray-600/20 text-white rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                                                                    {index + 1}
                                                                </div>
                                                                
                                                                {editingStepIndex === index ? (
                                                                    // Editing mode
                                                                    <div className="flex-grow space-y-3">
                                                                        <textarea
                                                                            value={editingStepText}
                                                                            onChange={(e) => setEditingStepText(e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                                                    e.preventDefault();
                                                                                    saveEditingStep();
                                                                                } else if (e.key === 'Escape') {
                                                                                    e.preventDefault();
                                                                                    cancelEditingStep();
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
                                                                            rows={3}
                                                                            autoFocus
                                                                            placeholder="Edit step description..."
                                                                        />
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={saveEditingStep}
                                                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={cancelEditingStep}
                                                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Ctrl+Enter to save • Esc to cancel
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // Display mode
                                                                    <>
                                                                        <div className="text-sm text-gray-200 leading-relaxed flex-grow">
                                                                            {step}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => startEditingStep(index)}
                                                                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-md transition-colors"
                                                                                title="Edit step"
                                                                            >
                                                                                <Icon type="edit" size="sm" className="text-gray-700" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteStep(index)}
                                                                                className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-md transition-colors"
                                                                                title="Delete step"
                                                                            >
                                                                                <Icon type="trash" size="sm" className="text-gray-700" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                        {isGeneratingSteps && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="flex items-center gap-3 p-3 bg-gray-800/20 rounded-lg border border-gray-700/30"
                                                            >
                                                                <Loader size={16} />
                                                                <span className="text-gray-400 text-sm">Generating more steps...</span>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Run Workflow Button */}
                                                    {!isGeneratingSteps && (
                                                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm text-gray-400">
                                                                    {generatedSteps.length} step{generatedSteps.length !== 1 ? 's' : ''} ready for execution
                                                                </div>
                                                                <Button
                                                                    onClick={runWorkflow}
                                                                    disabled={isWorkflowRunning || generatedSteps.length === 0}
                                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer hover:cursor-pointer"
                                                                >
                                                                    {isWorkflowRunning ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader size={14} />
                                                                            <span>Running...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon type="play" size="sm" className="text-white" />
                                                                            <span>Run Workflow</span>
                                                                        </div>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Icon type="sheet" size="lg" className="mx-auto mb-2 text-gray-700" />
                                                    <p>No workflow steps yet. Complete video analysis first.</p>
                                                </div>
                                            )}
                                        </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        )}

                        {/* Workflow Execution Section - Accordion */}
                        {(workflowOutput || workflowStatus !== 'idle' || isWorkflowRunning) && (
                        <div className="mb-4">
                            <div className="border border-gray-700 rounded-xl overflow-hidden bg-[#171717]">
                                <button 
                                    onClick={() => toggleSection('workflow')}
                                    disabled={!(workflowStatus !== 'idle' || isWorkflowRunning || !!workflowOutput)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                                        !(workflowStatus !== 'idle' || isWorkflowRunning || !!workflowOutput)
                                            ? 'bg-gray-800/20 cursor-not-allowed opacity-60' 
                                            : 'bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${
                                            workflowStatus === 'complete' ? 'bg-gray-600/20' : 
                                            workflowStatus === 'running' ? 'bg-gray-600/20' : 
                                            workflowStatus === 'error' ? 'bg-gray-600/20' : 'bg-gray-600/20'
                                        }`}>
                                            <Icon type="play" size="sm" className={`transition-colors ${
                                                workflowStatus === 'complete' ? 'text-white' : 
                                                workflowStatus === 'running' ? 'text-white' : 
                                                workflowStatus === 'error' ? 'text-white' : 'text-gray-700'
                                            }`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-white">Workflow Execution</h3>
                                            <p className="text-sm text-gray-400">
                                                {workflowStatus === 'idle' && 'Automated browser actions'}
                                                {workflowStatus === 'running' && 'Executing workflow steps...'}
                                                {workflowStatus === 'complete' && `Execution complete • ${workflowOutput ? workflowOutput.split('\n').length : 0} events`}
                                                {workflowStatus === 'error' && 'Execution failed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {workflowStatus === 'complete' && <Icon type="check" size="sm" className="text-white" />}
                                        {workflowStatus === 'running' && <Loader size={16} />}
                                        {workflowStatus === 'error' && <Icon type="x" size="sm" className="text-white" />}
                                        <Icon type={expandedSections.workflow ? 'chevron-up' : 'chevron-down'} size="sm" className="text-gray-700" />
                                    </div>
                                </button>
                                
                                <AnimatePresence mode="wait">
                                    {expandedSections.workflow && (
                                        <motion.div
                                            key="workflow-content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ 
                                                duration: 0.3,
                                                ease: [0.04, 0.62, 0.23, 0.98]
                                            }}
                                            className="border-t border-gray-700"
                                        >
                                        <div className="p-6">
                                            {workflowOutput ? (
                                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                                                    <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">
                                                        {workflowOutput}
                                                        {isWorkflowRunning && (
                                                            <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Icon type="play" size="lg" className="mx-auto mb-2 text-gray-700" />
                                                    <p>No workflow execution yet. Generate steps first.</p>
                                                </div>
                                            )}
                                        </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Video Modal */}
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
            <DialogContent className="max-w-4xl w-[90vw] h-[80vh] bg-[#111113] border border-gray-600 p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-white">
                        {selectedFiles[modalVideoIndex]?.name || 'Video Preview'}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 p-6 pt-2">
                    {selectedFiles[modalVideoIndex] && (
                        <div className="w-full h-full rounded-xl overflow-hidden bg-black">
                            <video
                                src={videoBlobUrls[modalVideoIndex] || ''}
                                controls
                                className="w-full h-full object-contain"
                                autoPlay
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </div>
    );
}
