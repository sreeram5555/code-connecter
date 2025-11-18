// import useAppContext from "@/hooks/useAppContext"
// import useFileSystem from "@/hooks/useFileSystem"
// import usePageEvents from "@/hooks/usePageEvents"
// import useSetting from "@/hooks/useSetting"
// import useSocket from "@/hooks/useSocket"
// import useWindowDimensions from "@/hooks/useWindowDimensions"
// import { editorThemes } from "@/resources/Themes"
// import ACTIONS from "@/utils/actions"
// import placeholder from "@/utils/editorPlaceholder"
// import { color } from "@uiw/codemirror-extensions-color"
// import { hyperLink } from "@uiw/codemirror-extensions-hyper-link"
// import { loadLanguage } from "@uiw/codemirror-extensions-langs"
// import CodeMirror from "@uiw/react-codemirror"
// import { useState, useRef, useEffect, useMemo } from "react"
// import { cursorTooltipBaseTheme, tooltipField } from "./tooltip"
// import "../../index.css"
// import { lineHighlightExtension, setHighlightedLines } from "@/utils/lineHighlightExtension"

// function Editor() {
//     const { users, currentUser } = useAppContext()
//     const {
//         currentFile,
//         setCurrentFile,
//         highlightedLines = [],
//     } = useFileSystem()
//     const { theme, language, fontSize } = useSetting()
//     const { socket } = useSocket()
//     const { tabHeight } = useWindowDimensions()
//     const [timeOut, setTimeOut] = useState(null)
//     const editorViewRef = useRef(null)
//     const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0)
//     const [similarLines, setSimilarLines] = useState([]) // New state for similar lines
//     const filteredUsers = users.filter(
//         (u) => u.username !== currentUser.username,
//     )

//     // Create the line highlighting extension
//     const highlightExt = useMemo(() => {
//         console.log('🎯 Creating highlight extension for AI lines:', highlightedLines);
//         return lineHighlightExtension();
//     }, []);

//     // Function to scroll to a specific line
//     const scrollToLine = (lineNumber) => {
//         if (!editorViewRef.current) return;
        
//         const view = editorViewRef.current;
//         try {
//             const line = view.state.doc.line(lineNumber);
//             view.dispatch({
//                 effects: EditorView.scrollIntoView(line.from, {
//                     y: "center"
//                 })
//             });
//             console.log(`📜 Scrolled to line ${lineNumber}`);
            
//             // Add visual feedback for the scrolled-to line
//             highlightTemporarily(lineNumber);
//         } catch (error) {
//             console.warn(`Cannot scroll to line ${lineNumber}:`, error);
//         }
//     };

//     // Temporary highlight for scrolled-to lines
//     const highlightTemporarily = (lineNumber) => {
//         if (!editorViewRef.current) return;
        
//         const view = editorViewRef.current;
//         const dom = view.dom;
//         const lineElements = dom.querySelectorAll('.cm-line');
//         const lineIndex = lineNumber - 1;
        
//         if (lineIndex >= 0 && lineIndex < lineElements.length) {
//             // Remove previous temporary highlights
//             dom.querySelectorAll('.cm-line-temporary-highlight').forEach(el => {
//                 el.classList.remove('cm-line-temporary-highlight');
//             });
            
//             // Add temporary highlight
//             lineElements[lineIndex].classList.add('cm-line-temporary-highlight');
            
//             // Remove after 3 seconds
//             setTimeout(() => {
//                 lineElements[lineIndex]?.classList.remove('cm-line-temporary-highlight');
//             }, 3000);
//         }
//     };

//     // Function to navigate through highlighted lines
//     const navigateHighlights = (direction) => {
//         if (highlightedLines.length === 0) return;
        
//         let newIndex;
//         if (direction === 'next') {
//             newIndex = (currentHighlightIndex + 1) % highlightedLines.length;
//         } else {
//             newIndex = (currentHighlightIndex - 1 + highlightedLines.length) % highlightedLines.length;
//         }
        
//         setCurrentHighlightIndex(newIndex);
//         scrollToLine(highlightedLines[newIndex]);
//     };

//     // Function to handle similar line clicks
//     const handleSimilarLineClick = (lineNumber) => {
//         console.log(`🔍 Clicked similar line ${lineNumber}`);
//         scrollToLine(lineNumber);
        
//         // Update current highlight index if this line is in highlightedLines
//         const indexInHighlights = highlightedLines.indexOf(lineNumber);
//         if (indexInHighlights !== -1) {
//             setCurrentHighlightIndex(indexInHighlights);
//         }
//     };

//     // Simulate AI finding similar lines (you'll replace this with actual AI data)
//     useEffect(() => {
//         // This simulates the AI finding similar lines like in your screenshot
//         const mockSimilarLines = [
//             { lineNumber: 2, content: '#include <bits/stdc++.h>', similarity: 0.95 },
//             { lineNumber: 3, content: 'using namespace std;', similarity: 0.92 },
//             { lineNumber: 10, content: 'int32_t main() {', similarity: 0.88 },
//             { lineNumber: 11, content: 'ios::sync_with_stdio(false);', similarity: 0.85 },
//         ];
//         setSimilarLines(mockSimilarLines);
//     }, [currentFile?.content]);

//     // Effect to apply AI suggested highlights and auto-scroll to first one
//     useEffect(() => {
//         if (!editorViewRef.current || !highlightedLines.length) return;

//         const view = editorViewRef.current;
        
//         console.log('🚀 Applying AI line highlights:', highlightedLines);
        
//         // Apply highlights using CodeMirror's effect system
//         view.dispatch({
//             effects: setHighlightedLines.of(highlightedLines)
//         });

//         // Auto-scroll to the first highlighted line
//         if (highlightedLines.length > 0) {
//             setCurrentHighlightIndex(0);
//             setTimeout(() => {
//                 scrollToLine(highlightedLines[0]);
//             }, 300);
//         }

//     }, [highlightedLines, currentFile?.content]);

//     // Keyboard navigation for highlighted lines
//     useEffect(() => {
//         const handleKeyPress = (event) => {
//             if (event.ctrlKey || event.metaKey) {
//                 if (event.key === 'ArrowDown') {
//                     event.preventDefault();
//                     navigateHighlights('next');
//                 } else if (event.key === 'ArrowUp') {
//                     event.preventDefault();
//                     navigateHighlights('prev');
//                 }
//             }
//         };

//         window.addEventListener('keydown', handleKeyPress);
//         return () => window.removeEventListener('keydown', handleKeyPress);
//     }, [currentHighlightIndex, highlightedLines]);

//     const onCodeChange = (code, view) => {
//         const file = { ...currentFile, content: code }
//         setCurrentFile(file)
//         socket.emit(ACTIONS.FILE_UPDATED, { file })
//         const cursorPosition = view.state?.selection?.main?.head
//         socket.emit(ACTIONS.TYPING_START, { cursorPosition })
//         clearTimeout(timeOut)
//         const newTimeOut = setTimeout(
//             () => socket.emit(ACTIONS.TYPING_PAUSE),
//             1000,
//         )
//         setTimeOut(newTimeOut)
//     }

//     usePageEvents()

//     const getExtensions = () => {
//         const extensions = [
//             color,
//             hyperLink,
//             tooltipField(filteredUsers),
//             cursorTooltipBaseTheme,
//             highlightExt, // Add our highlight extension
//         ]

//         const langExt = language !== "c++"
//             ? loadLanguage(language.toLowerCase())
//             : loadLanguage("cpp")

//         if (langExt) {
//             extensions.push(langExt)
//         } else {
//             console.error("Syntax Highlighting not available for this language")
//         }
//         return extensions
//     }

//     const handleEditorMount = (view) => {
//         editorViewRef.current = view;
//         console.log('✅ Editor mounted successfully');
        
//         // Apply initial AI highlights after mount
//         setTimeout(() => {
//             if (highlightedLines.length > 0) {
//                 console.log('🔄 Applying initial AI highlights...');
//                 view.dispatch({
//                     effects: setHighlightedLines.of(highlightedLines)
//                 });
                
//                 // Scroll to first highlight
//                 setTimeout(() => {
//                     scrollToLine(highlightedLines[0]);
//                 }, 500);
//             }
//         }, 200);
//     }

//     return (
//         <div style={{ position: "relative", height: "100%" }}>
//             {/* Enhanced AI Analysis Panel */}
//             <div
//                 style={{
//                     position: "absolute",
//                     top: "10px",
//                     right: "10px",
//                     background: "linear-gradient(135deg, #1e40af 0%, #3730a3 100%)",
//                     color: "white",
//                     padding: "20px",
//                     borderRadius: "12px",
//                     fontSize: "14px",
//                     zIndex: 1000,
//                     fontFamily: "system-ui, -apple-system, sans-serif",
//                     boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
//                     fontWeight: "bold",
//                     border: "3px solid #4f46e5",
//                     maxWidth: "450px",
//                     minWidth: "350px"
//                 }}
//             >
//                 {/* Similar Lines Section */}
//                 <div style={{ 
//                     background: "rgba(255,255,255,0.1)", 
//                     padding: "16px", 
//                     borderRadius: "8px",
//                     marginBottom: "16px"
//                 }}>
//                     <div style={{ 
//                         display: "flex", 
//                         alignItems: "center", 
//                         gap: "10px", 
//                         marginBottom: "12px" 
//                     }}>
//                         <span style={{ fontSize: "16px" }}>🔍</span>
//                         <span style={{ fontSize: "15px" }}>Similar Lines Found</span>
//                         <span style={{ 
//                             background: "#f59e0b", 
//                             color: "white", 
//                             padding: "2px 8px", 
//                             borderRadius: "12px", 
//                             fontSize: "12px",
//                             fontWeight: "bold"
//                         }}>
//                             {similarLines.length}
//                         </span>
//                     </div>
                    
//                     <div style={{ 
//                         maxHeight: "120px", 
//                         overflowY: "auto",
//                         background: "rgba(0,0,0,0.2)",
//                         borderRadius: "6px",
//                         padding: "8px"
//                     }}>
//                         {similarLines.map((similar, index) => (
//                             <div
//                                 key={index}
//                                 onClick={() => handleSimilarLineClick(similar.lineNumber)}
//                                 style={{
//                                     display: "flex",
//                                     alignItems: "center",
//                                     gap: "10px",
//                                     padding: "6px 8px",
//                                     borderRadius: "4px",
//                                     cursor: "pointer",
//                                     marginBottom: "4px",
//                                     background: "rgba(255,255,255,0.05)",
//                                     transition: "all 0.2s ease",
//                                     border: "1px solid rgba(255,255,255,0.1)"
//                                 }}
//                                 onMouseEnter={(e) => {
//                                     e.target.style.background = "rgba(255,255,255,0.15)";
//                                     e.target.style.borderColor = "rgba(255,255,255,0.3)";
//                                 }}
//                                 onMouseLeave={(e) => {
//                                     e.target.style.background = "rgba(255,255,255,0.05)";
//                                     e.target.style.borderColor = "rgba(255,255,255,0.1)";
//                                 }}
//                             >
//                                 <div style={{
//                                     background: "#10b981",
//                                     color: "white",
//                                     width: "24px",
//                                     height: "24px",
//                                     borderRadius: "4px",
//                                     display: "flex",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     fontSize: "11px",
//                                     fontWeight: "bold",
//                                     flexShrink: 0
//                                 }}>
//                                     {similar.lineNumber}
//                                 </div>
//                                 <div style={{ 
//                                     fontSize: "12px", 
//                                     flex: 1,
//                                     overflow: "hidden",
//                                     textOverflow: "ellipsis",
//                                     whiteSpace: "nowrap"
//                                 }}>
//                                     {similar.content}
//                                 </div>
//                                 <div style={{
//                                     fontSize: "10px",
//                                     background: "rgba(255,255,255,0.2)",
//                                     padding: "2px 6px",
//                                     borderRadius: "8px",
//                                     flexShrink: 0
//                                 }}>
//                                     {Math.round(similar.similarity * 100)}%
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Navigation Section */}
//                 {highlightedLines.length > 0 ? (
//                     <div>
//                         <div style={{ 
//                             display: 'flex', 
//                             alignItems: 'center', 
//                             gap: '10px', 
//                             marginBottom: '12px' 
//                         }}>
//                             <span style={{ fontSize: '16px' }}>🤖</span>
//                             <span style={{ fontSize: '15px' }}>AI Code Analysis</span>
//                         </div>
                        
//                         <div style={{ marginBottom: '12px' }}>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                 <div><strong>Highlighted Lines:</strong></div>
//                                 <div style={{ 
//                                     background: "rgba(255,255,255,0.2)", 
//                                     padding: "2px 8px", 
//                                     borderRadius: "8px",
//                                     fontSize: "12px"
//                                 }}>
//                                     {highlightedLines.length} total
//                                 </div>
//                             </div>
//                             <div style={{ 
//                                 color: '#fef3c7', 
//                                 fontSize: '13px',
//                                 background: 'rgba(0,0,0,0.2)',
//                                 padding: '8px',
//                                 borderRadius: '6px',
//                                 marginTop: '6px',
//                                 maxHeight: '60px',
//                                 overflowY: 'auto',
//                                 fontFamily: 'monospace'
//                             }}>
//                                 [{highlightedLines.join(', ')}]
//                             </div>
//                         </div>

//                         <div style={{ 
//                             display: 'flex', 
//                             justifyContent: 'space-between',
//                             alignItems: 'center',
//                             marginBottom: '12px',
//                             background: 'rgba(255,255,255,0.1)',
//                             padding: '10px',
//                             borderRadius: '6px'
//                         }}>
//                             <div>
//                                 <div style={{ fontSize: '12px', opacity: 0.8 }}>Current Line</div>
//                                 <div style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 'bold' }}>
//                                     Line {highlightedLines[currentHighlightIndex]}
//                                 </div>
//                             </div>
//                             <div style={{ textAlign: 'center' }}>
//                                 <div style={{ fontSize: '12px', opacity: 0.8 }}>Position</div>
//                                 <div style={{ color: '#93c5fd', fontSize: '16px', fontWeight: 'bold' }}>
//                                     {currentHighlightIndex + 1}/{highlightedLines.length}
//                                 </div>
//                             </div>
//                         </div>

//                         <div style={{ 
//                             display: 'flex', 
//                             gap: '10px',
//                             marginBottom: '12px'
//                         }}>
//                             <button
//                                 onClick={() => navigateHighlights('prev')}
//                                 disabled={highlightedLines.length <= 1}
//                                 style={{
//                                     background: '#3b82f6',
//                                     color: 'white',
//                                     border: 'none',
//                                     padding: '10px 16px',
//                                     borderRadius: '8px',
//                                     cursor: highlightedLines.length > 1 ? 'pointer' : 'not-allowed',
//                                     fontSize: '13px',
//                                     fontWeight: 'bold',
//                                     opacity: highlightedLines.length > 1 ? 1 : 0.5,
//                                     flex: 1,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                     gap: '6px',
//                                     transition: 'all 0.2s ease'
//                                 }}
//                                 onMouseEnter={(e) => {
//                                     if (highlightedLines.length > 1) {
//                                         e.target.style.background = '#2563eb';
//                                         e.target.style.transform = 'translateY(-1px)';
//                                     }
//                                 }}
//                                 onMouseLeave={(e) => {
//                                     if (highlightedLines.length > 1) {
//                                         e.target.style.background = '#3b82f6';
//                                         e.target.style.transform = 'translateY(0)';
//                                     }
//                                 }}
//                             >
//                                 ⬆️ Previous
//                             </button>
//                             <button
//                                 onClick={() => navigateHighlights('next')}
//                                 disabled={highlightedLines.length <= 1}
//                                 style={{
//                                     background: '#3b82f6',
//                                     color: 'white',
//                                     border: 'none',
//                                     padding: '10px 16px',
//                                     borderRadius: '8px',
//                                     cursor: highlightedLines.length > 1 ? 'pointer' : 'not-allowed',
//                                     fontSize: '13px',
//                                     fontWeight: 'bold',
//                                     opacity: highlightedLines.length > 1 ? 1 : 0.5,
//                                     flex: 1,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'center',
//                                     gap: '6px',
//                                     transition: 'all 0.2s ease'
//                                 }}
//                                 onMouseEnter={(e) => {
//                                     if (highlightedLines.length > 1) {
//                                         e.target.style.background = '#2563eb';
//                                         e.target.style.transform = 'translateY(-1px)';
//                                     }
//                                 }}
//                                 onMouseLeave={(e) => {
//                                     if (highlightedLines.length > 1) {
//                                         e.target.style.background = '#3b82f6';
//                                         e.target.style.transform = 'translateY(0)';
//                                     }
//                                 }}
//                             >
//                                 Next ⬇️
//                             </button>
//                         </div>

//                         <div style={{ 
//                             fontSize: '11px', 
//                             opacity: 0.8, 
//                             textAlign: 'center',
//                             borderTop: '1px solid rgba(255,255,255,0.2)',
//                             paddingTop: '10px',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             gap: '8px'
//                         }}>
//                             <span>📍</span>
//                             <span>Click similar lines above or use Ctrl+↑/↓ to navigate</span>
//                         </div>
//                     </div>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <div style={{ fontSize: '16px', marginBottom: '8px' }}>⏳</div>
//                         <div>Waiting for AI analysis...</div>
//                         <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
//                             AI will highlight important code sections
//                         </div>
//                     </div>
//                 )}
//             </div>

//             <CodeMirror
//                 placeholder={placeholder(currentFile.name)}
//                 mode={language.toLowerCase()}
//                 theme={editorThemes[theme]}
//                 onChange={onCodeChange}
//                 onMount={handleEditorMount}
//                 value={currentFile.content}
//                 extensions={getExtensions()}
//                 minHeight="100%"
//                 maxWidth="100vw"
//                 style={{
//                     fontSize: fontSize + "px",
//                     height: tabHeight,
//                     position: "relative",
//                 }}
//             />
//         </div>
//     )
// }

// export default Editor
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
import { useState, useEffect, useRef, useMemo } from "react"
import { cursorTooltipBaseTheme, tooltipField } from "./tooltip"
import { EditorView, Decoration, ViewPlugin } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { RangeSetBuilder } from "@codemirror/state"
import axios from "axios"
import toast from "react-hot-toast"

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

function Editor() {
    const { users, currentUser } = useAppContext()
    const { currentFile, setCurrentFile } = useFileSystem()
    const { theme, language, fontSize } = useSetting()
    const { socket } = useSocket()
    const { tabHeight } = useWindowDimensions()
    const [timeOut, setTimeOut] = useState(null)
    
    // New State for AI Question and Analysis
    const [question, setQuestion] = useState("")
    const [analysisData, setAnalysisData] = useState(null)
    
    // Refs to hold latest values for the interval
    const codeRef = useRef(currentFile.content)
    const questionRef = useRef("")
    
    // Update refs when state changes
    useEffect(() => {
        codeRef.current = currentFile.content
    }, [currentFile.content])
    
    useEffect(() => {
        questionRef.current = question
    }, [question])

    const filteredUsers = users.filter(
        (u) => u.username !== currentUser.username,
    )

    // Live Analysis Loop (Every 1 Second)
    useEffect(() => {
        const interval = setInterval(async () => {
            // Only send if there is a question or code
            if (!questionRef.current && !codeRef.current) return;

            try {
                // Assuming the ML agent is running locally on port 5000 as per your example
                const response = await axios.post("http://localhost:5000/analyze", {
                    question: questionRef.current,
                    user_code: codeRef.current
                });
                
                if (response.data) {
                    setAnalysisData(response.data);
                }
            } catch (error) {
                // Fail silently or log to console to avoid spamming toasts every second
                console.error("ML Agent analysis failed:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const onCodeChange = (code, view) => {
        const file = { ...currentFile, content: code }
        setCurrentFile(file)
        socket.emit(ACTIONS.FILE_UPDATED, { file })
        const cursorPosition = view.state?.selection?.main?.head
        socket.emit(ACTIONS.TYPING_START, { cursorPosition })
        clearTimeout(timeOut)
        const newTimeOut = setTimeout(
            () => socket.emit(ACTIONS.TYPING_PAUSE),
            1000,
        )
        setTimeOut(newTimeOut)
    }

    // Listen wheel event to zoom in/out and prevent page reload
    usePageEvents()

    // Generate extensions including the new highlighter
    const getExtensions = () => {
        const extensions = [
            color,
            hyperLink,
            tooltipField(filteredUsers),
            cursorTooltipBaseTheme,
            highlightField, // Add the highlight field
        ]
        const langExt = language !== 'c++' ? loadLanguage(language.toLowerCase()) : loadLanguage('cpp')
        
        if (langExt) {
            extensions.push(langExt)
        }
        
        // Create a view plugin to dispatch highlighting effects when analysisData changes
        const highlightPlugin = ViewPlugin.fromClass(class {
            constructor(view) {
                this.updateHighlights(view)
            }
            update(update) {
                if (analysisData !== this.lastData) {
                    this.updateHighlights(update.view)
                    this.lastData = analysisData
                }
            }
            updateHighlights(view) {
                if (!analysisData || !analysisData.similar_lines) {
                    view.dispatch({ effects: addHighlight.of(Decoration.none) })
                    return
                }

                const builder = new RangeSetBuilder()
                
                // Focus on ChatGPT lines as requested, or fallback to others
                const lines = analysisData.similar_lines.chatgpt_vs_user || 
                              analysisData.similar_lines.gemini_vs_user || [];
                
                // Sort lines by line number to ensure builder order
                const sortedLines = [...lines].sort((a, b) => a.user_line_number - b.user_line_number);

                for (const lineInfo of sortedLines) {
                    const lineNum = lineInfo.user_line_number;
                    // Ensure line exists in document
                    if (lineNum <= view.state.doc.lines) {
                        const line = view.state.doc.line(lineNum);
                        // Add decoration to the full line
                        builder.add(line.from, line.from, Decoration.line({ class: "cm-similar-line" }));
                    }
                }
                
                view.dispatch({ effects: addHighlight.of(builder.finish()) })
            }
        });
        
        extensions.push(highlightPlugin);

        return extensions
    }

    return (
        <div className="flex flex-col w-full" style={{ height: tabHeight }}>
            {/* Question Input Area - Fixed Height */}
            <div className="bg-darkHover p-2 border-b border-gray-700 shrink-0">
                <label className="text-xs text-gray-400 mb-1 block">Ask AI Agent (Live)</label>
                <textarea
                    className="w-full h-16 bg-dark text-white p-2 rounded resize-none text-sm outline-none focus:border focus:border-primary"
                    placeholder="Write your question here to analyze code live..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
            </div>

            {/* Code Editor Area - Flex Grow to fill remaining space */}
            <div className="flex-grow relative overflow-hidden">
                <CodeMirror
                    placeholder={placeholder(currentFile.name)}
                    mode={language.toLowerCase()}
                    theme={editorThemes[theme]}
                    onChange={onCodeChange}
                    value={currentFile.content}
                    extensions={getExtensions()}
                    height="100%" // Force CodeMirror to fill the container
                    style={{
                        fontSize: fontSize + "px",
                        height: "100%", // Important for scrolling
                        position: "absolute", // Position absolute to stick to container
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                />
            </div>
        </div>
    )
}

export default Editor