import useAppContext from "@/hooks/useAppContext"
import useFileSystem from "@/hooks/useFileSystem"
import usePageEvents from "@/hooks/usePageEvents"
import useSetting from "@/hooks/useSetting"
import useSocket from "@/hooks/useSocket"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import { editorThemes } from "@/resources/Themes"
import ACTIONS from "@/utils/actions"
import placeholder from "@/utils/editorPlaceholder"
import { color } from "@uiw/codemirror-extensions-color"
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link"
import { loadLanguage } from "@uiw/codemirror-extensions-langs"
import CodeMirror from "@uiw/react-codemirror"
import { useState, useEffect, useRef, useCallback } from "react"
import { cursorTooltipBaseTheme, tooltipField } from "./tooltip"
import { EditorView, Decoration, ViewPlugin } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { RangeSetBuilder } from "@codemirror/state"
import axios from "axios"

// Define an effect to update highlighting
const addHighlight = StateEffect.define()

// State field to manage decorations for similar lines
const highlightField = StateField.define({
    create() {
        return Decoration.none
    },
    update(highlights, tr) {
        highlights = highlights.map(tr.changes)
        for (let e of tr.effects) {
            if (e.is(addHighlight)) {
                highlights = e.value
            }
        }
        return highlights
    },
    provide: (f) => EditorView.decorations.from(f),
})

// ML Agent URLs
const ML_AGENT_BASE_URL = "https://code-plag-fastapi.onrender.com"
const ANALYZE_ENDPOINT = `${ML_AGENT_BASE_URL}/analyze`
const GENERATE_ENDPOINT = `${ML_AGENT_BASE_URL}/generate`

// Available languages for the dropdown
const LANGUAGE_OPTIONS = [
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "c", label: "C" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
]

function Editor() {
    const { users, currentUser } = useAppContext()
    const { currentFile, setCurrentFile } = useFileSystem()
    const { theme, fontSize } = useSetting()
    const { socket } = useSocket()
    const { tabHeight } = useWindowDimensions()
    const [timeOut, setTimeOut] = useState(null)

    // AI State
    const [question, setQuestion] = useState("")
    const [analysisData, setAnalysisData] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState("")
    const [selectedLanguage, setSelectedLanguage] = useState("cpp")
    const [step, setStep] = useState("") // Track current step: "generating" or "analyzing"
    
    const codeRef = useRef(currentFile.content)
    const questionRef = useRef("")
    const editorViewRef = useRef(null)
    const isEditorReadyRef = useRef(false)
    const pendingHighlightsRef = useRef(null)
    
    useEffect(() => { codeRef.current = currentFile.content }, [currentFile.content])
    useEffect(() => { questionRef.current = question }, [question])

    const filteredUsers = users.filter((u) => u.username !== currentUser.username)

    // Function to generate AI codes first, then analyze
    // const sendQuestionToML = useCallback(async () => {
    //     if (!question.trim()) {
    //         setError("Please enter a question first");
    //         return;
    //     }

    //     if (!codeRef.current.trim()) {
    //         setError("Please write some code first");
    //         return;
    //     }

    //     setIsAnalyzing(true);
    //     setError("");
    //     setAnalysisData(null);
    //     setStep("generating");

    //     try {
    //         console.log('🔄 Step 1: Generating AI codes...');

    //         // Step 1: Generate AI codes
    //         const generateResponse = await axios.post(GENERATE_ENDPOINT, {
    //             question: question.trim(),
    //             language: selectedLanguage
    //         }, {
    //             timeout: 30000,
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             }
    //         });

    //         if (!generateResponse.data || !generateResponse.data.generated_codes) {
    //             throw new Error("No AI codes generated");
    //         }

    //         const generatedCodes = generateResponse.data.generated_codes;
    //         console.log('✅ AI codes generated:', Object.keys(generatedCodes));

    //         setStep("analyzing");

    //         // Step 2: Analyze for similarities
    //         console.log('🔄 Step 2: Analyzing for similarities...');

    //         const analyzeResponse = await axios.post(ANALYZE_ENDPOINT, {
    //             question: question.trim(),
    //             language: selectedLanguage,
    //             user_code: codeRef.current,
    //             gemini_code: generatedCodes.gemini || "",
    //             chatgpt_code: generatedCodes.chatgpt || "",
    //             claude_code: generatedCodes.claude || ""
    //         }, {
    //             timeout: 30000,
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             }
    //         });

    //         if (analyzeResponse.data) {
    //             setAnalysisData(analyzeResponse.data);
    //             console.log('✅ Analysis completed successfully');
    //         }

    //     } catch (error) {
    //         console.error("❌ ML Agent process failed:", error);
            
    //         if (error.response?.status === 422) {
    //             setError("Server validation error - check request format");
    //             console.log('🔴 Response data:', error.response.data);
    //         } else if (error.code === 'ECONNABORTED') {
    //             setError("Request timeout - ML agent might be starting up");
    //         } else if (error.response) {
    //             setError(`Server error: ${error.response.status}`);
    //         } else if (error.request) {
    //             setError("No response received from ML agent");
    //         } else {
    //             setError(`Error: ${error.message}`);
    //         }
    //     } finally {
    //         setIsAnalyzing(false);
    //         setStep("");
    //     }
    // }, [question, selectedLanguage]);


    const sendQuestionToML = useCallback(async () => {
    if (!question.trim()) {
        setError("Please enter a question first");
        return;
    }

    if (!codeRef.current.trim()) {
        setError("Please write some code first");
        return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysisData(null);
    setStep("generating");

    try {
        console.log('🔄 Step 1: Generating AI codes...');

        // Step 1: Generate AI codes
        const generateResponse = await axios.post(GENERATE_ENDPOINT, {
            question: question.trim(),
            language: selectedLanguage
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!generateResponse.data || !generateResponse.data.generated_codes) {
            throw new Error("No AI codes generated");
        }

        const generatedCodes = generateResponse.data.generated_codes;
        console.log('✅ AI codes generated:', Object.keys(generatedCodes));

        setStep("analyzing");

        // Step 2: Analyze for similarities - USE CURRENT LIVE CODE
        console.log('🔄 Step 2: Analyzing for similarities...');

        const analyzeResponse = await axios.post(ANALYZE_ENDPOINT, {
            question: question.trim(),
            language: selectedLanguage,
            user_code: codeRef.current, // Use live current code
            gemini_code: generatedCodes.gemini || "",
            chatgpt_code: generatedCodes.chatgpt || "",
            claude_code: generatedCodes.claude || ""
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (analyzeResponse.data) {
            setAnalysisData(analyzeResponse.data);
            console.log('✅ Analysis completed successfully');
        }

    } catch (error) {
        console.error("❌ ML Agent process failed:", error);
        
        if (error.response?.status === 422) {
            setError("Server validation error - check request format");
            console.log('🔴 Response data:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            setError("Request timeout - ML agent might be starting up");
        } else if (error.response) {
            setError(`Server error: ${error.response.status}`);
        } else if (error.request) {
            setError("No response received from ML agent");
        } else {
            setError(`Error: ${error.message}`);
        }
    } finally {
        setIsAnalyzing(false);
        setStep("");
    }
}, [question, selectedLanguage]);


    const onCodeChange = useCallback((code, view) => {
        const file = { ...currentFile, content: code }
        setCurrentFile(file)
        socket.emit(ACTIONS.FILE_UPDATED, { file })
        const cursorPosition = view.state?.selection?.main?.head
        socket.emit(ACTIONS.TYPING_START, { cursorPosition })
        clearTimeout(timeOut)
        const newTimeOut = setTimeout(() => socket.emit(ACTIONS.TYPING_PAUSE), 1000)
        setTimeOut(newTimeOut)
    }, [currentFile, socket, timeOut])

    usePageEvents()

    // Safe highlight extension
    const getExtensions = useCallback(() => {
        const extensions = [
            color,
            hyperLink,
            tooltipField(filteredUsers),
            cursorTooltipBaseTheme,
            highlightField,
        ]
        const langExt = selectedLanguage !== 'c++' ? loadLanguage(selectedLanguage.toLowerCase()) : loadLanguage('cpp')
        if (langExt) extensions.push(langExt)
        
        return extensions;
    }, [filteredUsers, selectedLanguage])

    // Effect to handle highlights safely
    useEffect(() => {
        if (!editorViewRef.current || !isEditorReadyRef.current) {
            pendingHighlightsRef.current = analysisData;
            return;
        }

        const applyHighlightsSafely = () => {
            const view = editorViewRef.current;
            if (!view || view.isDestroyed) return;

            try {
                if (!analysisData?.similar_lines) {
                    setTimeout(() => {
                        try {
                            view.dispatch({ effects: addHighlight.of(Decoration.none) });
                        } catch (err) {
                            console.log('Cleared highlights safely');
                        }
                    }, 100);
                    return;
                }

                const builder = new RangeSetBuilder()
                const lines = analysisData.similar_lines.chatgpt_vs_user || []
                const safeLines = lines.slice(0, 20);

                for (const lineInfo of safeLines) {
                    const lineNum = lineInfo.user_line_number;
                    if (lineNum > 0 && lineNum <= view.state.doc.lines) {
                        try {
                            const line = view.state.doc.line(lineNum);
                            builder.add(line.from, line.from, Decoration.line({ 
                                class: "cm-similar-line"
                            }));
                        } catch (err) {
                            // Silent fail
                        }
                    }
                }

                const decorations = builder.finish();
                
                setTimeout(() => {
                    try {
                        view.dispatch({ effects: addHighlight.of(decorations) });
                    } catch (err) {
                        console.log('Highlights applied in next cycle');
                    }
                }, 50);
                
            } catch (err) {
                console.log('Highlight application deferred');
            }
        };

        const timeoutId = setTimeout(applyHighlightsSafely, 100);
        return () => clearTimeout(timeoutId);
    }, [analysisData]);

    // Get editor reference safely
    const handleEditorCreate = useCallback((view) => {
        editorViewRef.current = view;
        isEditorReadyRef.current = true;
        
        if (pendingHighlightsRef.current) {
            setTimeout(() => {
                setAnalysisData(pendingHighlightsRef.current);
                pendingHighlightsRef.current = null;
            }, 500);
        }
    }, []);

    // Safe: Get similar lines with validation
    const similarLines = analysisData?.similar_lines?.chatgpt_vs_user || []
    const safeSimilarLines = similarLines.slice(0, 20);
    const similarCount = safeSimilarLines.length

    // Safe scroll function
    const scrollToLine = useCallback((lineNumber) => {
        if (!editorViewRef.current || !isEditorReadyRef.current) return;
        
        const view = editorViewRef.current;
        if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
            setTimeout(() => {
                try {
                    const line = view.state.doc.line(lineNumber);
                    view.dispatch({
                        selection: { anchor: line.from },
                        effects: EditorView.scrollIntoView(line.from, { y: "center" })
                    });
                } catch (err) {
                    console.log('Scroll completed safely');
                }
            }, 100);
        }
    }, [])

    // Handle question input change
    const handleQuestionChange = useCallback((e) => {
        setQuestion(e.target.value);
    }, [])

    // Handle language change
    const handleLanguageChange = useCallback((e) => {
        setSelectedLanguage(e.target.value);
    }, [])

    // Handle Enter key press in question input
    const handleQuestionKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestionToML();
        }
    }, [sendQuestionToML])

    // Get status text for UI
    const getStatusText = () => {
        if (step === "generating") return "Generating AI code samples...";
        if (step === "analyzing") return "Analyzing for similarities...";
        if (isAnalyzing) return "Processing...";
        return "Send Question";
    }

    return (
        <div className="flex flex-col w-full h-full">
            {/* Top Section: Question Input + Language Selector + Send Button */}
            <div className="bg-darkHover border-b border-gray-700 shrink-0 p-3">
                <div className="flex items-center gap-3 mb-3">
                    {/* Language Selector */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400 mb-1">Language</label>
                        <select
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            className="bg-dark border border-gray-600 text-white text-sm rounded px-3 py-2 outline-none focus:border-primary min-w-[120px]"
                        >
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Question Input */}
                    <div className="flex-1 flex flex-col">
                        <label className="text-xs text-gray-400 mb-1">Ask AI to analyze code</label>
                        <div className="flex gap-2">
                            <textarea
                                className="flex-1 h-10 bg-dark text-white p-2 rounded resize-none text-sm outline-none focus:border focus:border-primary"
                                placeholder="Describe what you want to analyze..."
                                value={question}
                                onChange={handleQuestionChange}
                                onKeyPress={handleQuestionKeyPress}
                                rows={1}
                            />
                            <button
                                onClick={sendQuestionToML}
                                disabled={isAnalyzing || !question.trim() || !currentFile.content.trim()}
                                className={`px-4 py-2 rounded text-sm font-medium transition-all min-w-[140px] ${
                                    isAnalyzing || !question.trim() || !currentFile.content.trim()
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary text-black hover:bg-primary/90'
                                }`}
                            >
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        {getStatusText()}
                                    </div>
                                ) : (
                                    'Send Question'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Error Display */}
                {error && (
                    <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-800 flex justify-between items-center">
                        <span>❌ {error}</span>
                        <button 
                            onClick={() => setError("")}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
                
                {/* Analysis Steps Progress */}
                {isAnalyzing && step && (
                    <div className="text-blue-400 text-sm p-2 bg-blue-900/20 rounded border border-blue-800">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                            <span>
                                {step === "generating" && "🔄 Step 1/2: Generating AI code samples..."}
                                {step === "analyzing" && "🔍 Step 2/2: Analyzing for similarities..."}
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Similar Lines Indicator with Details */}
                {similarCount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-primary font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            <span className="bg-primary/20 px-2 py-1 rounded">
                                {similarCount} Similar Lines Found
                            </span>
                            {similarLines.length > 20 && (
                                <span className="text-xs text-yellow-400">
                                    (Showing first 20)
                                </span>
                            )}
                        </div>
                        
                        {/* Quick actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => scrollToLine(safeSimilarLines[0]?.user_line_number)}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                                Jump to First
                            </button>
                            <button
                                onClick={() => {
                                    const lastLine = safeSimilarLines[safeSimilarLines.length - 1]?.user_line_number;
                                    scrollToLine(lastLine);
                                }}
                                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                            >
                                Jump to Last
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0 editor-main-container">
                {/* Similar Lines Sidebar */}
                {similarCount > 0 && (
                    <div 
                        className="similar-lines-sidebar"
                        style={{ 
                            width: '600px',
                            minWidth: '600px',
                            backgroundColor: '#1a1d23',
                            borderRight: '3px solid #374151'
                        }}
                    >
                        <div className="sidebar-header">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 bg-primary rounded-full"></span>
                                <h3 className="text-white font-bold">
                                    🤖 Flagged Lines
                                </h3>
                                <span className="sidebar-count">
                                    {similarCount} found
                                </span>
                                {similarLines.length > 20 && (
                                    <span className="text-xs text-yellow-400">
                                        (Limited to 20)
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 mt-3">
                                Lines that match AI-generated code patterns
                            </p>
                        </div>
                        
                        <div className="sidebar-content">
                            {safeSimilarLines.map((lineInfo, index) => (
                                <div
                                    key={index}
                                    onClick={() => scrollToLine(lineInfo.user_line_number)}
                                    className="similar-line-item"
                                >
                                    <div className="line-info">
                                        <span className="line-number-badge">
                                            📍 Line {lineInfo.user_line_number}
                                        </span>
                                        <span className="index-badge">
                                            Match #{index + 1}
                                        </span>
                                    </div>
                                    <code className="similar-line-content">
                                        {lineInfo.line_content.trim()}
                                    </code>
                                    <div className="ai-line-info">
                                        <span>
                                            🔗 AI Line: {lineInfo.ai_line_number}
                                        </span>
                                        <span className="jump-link">
                                            Jump to line →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Editor Container */}
                <div className={`flex-1 min-w-0 ${similarCount > 0 ? '' : 'w-full'}`}>
                    <CodeMirror
                        placeholder={placeholder(currentFile.name)}
                        mode={selectedLanguage.toLowerCase()}
                        theme={editorThemes[theme]}
                        onChange={onCodeChange}
                        onCreateEditor={handleEditorCreate}
                        value={currentFile.content}
                        extensions={getExtensions()}
                        height="100%"
                        style={{
                            fontSize: fontSize + "px",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default Editor