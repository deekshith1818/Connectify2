import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    Pencil, 
    PenTool, 
    Eraser, 
    Trash2, 
    Download,
    Palette
} from 'lucide-react';
import { Button } from './ui/button';

const Whiteboard = ({ socket, roomId }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3b82f6');
    const [brushSize, setBrushSize] = useState('thin'); // 'thin' or 'thick'
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
    const [prevPoint, setPrevPoint] = useState(null);

    // Get canvas dimensions for scaling
    const getCanvasOffset = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
        
        const rect = canvas.getBoundingClientRect();
        return {
            offsetX: rect.left,
            offsetY: rect.top,
            scaleX: canvas.width / rect.width,
            scaleY: canvas.height / rect.height
        };
    }, []);

    // Draw line on canvas
    const drawLine = useCallback((prevPoint, currentPoint, color, width) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
    }, []);

    // Clear the canvas
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Get current brush width based on settings
    const getBrushWidth = useCallback(() => {
        if (tool === 'eraser') return 30;
        return brushSize === 'thin' ? 3 : 8;
    }, [tool, brushSize]);

    // Get current color based on tool
    const getCurrentColor = useCallback(() => {
        return tool === 'eraser' ? '#ffffff' : color;
    }, [tool, color]);

    // Handle mouse down
    const handleMouseDown = useCallback((e) => {
        const { offsetX, offsetY, scaleX, scaleY } = getCanvasOffset();
        const x = (e.clientX - offsetX) * scaleX;
        const y = (e.clientY - offsetY) * scaleY;
        
        setIsDrawing(true);
        setPrevPoint({ x, y });
    }, [getCanvasOffset]);

    // Handle mouse move
    const handleMouseMove = useCallback((e) => {
        if (!isDrawing || !prevPoint) return;

        const { offsetX, offsetY, scaleX, scaleY } = getCanvasOffset();
        const x = (e.clientX - offsetX) * scaleX;
        const y = (e.clientY - offsetY) * scaleY;
        const currentPoint = { x, y };

        const currentColor = getCurrentColor();
        const width = getBrushWidth();

        // Optimistic update - draw locally immediately
        drawLine(prevPoint, currentPoint, currentColor, width);

        // Emit to other users
        if (socket) {
            socket.emit('draw-line', {
                roomId,
                prevPoint,
                currentPoint,
                color: currentColor,
                width
            });
        }

        setPrevPoint(currentPoint);
    }, [isDrawing, prevPoint, socket, roomId, getCurrentColor, getBrushWidth, drawLine, getCanvasOffset]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);
        setPrevPoint(null);
    }, []);

    // Handle touch events for mobile
    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
        handleMouseDown(mouseEvent);
    }, [handleMouseDown]);

    const handleTouchMove = useCallback((e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
        handleMouseMove(mouseEvent);
    }, [handleMouseMove]);

    const handleTouchEnd = useCallback((e) => {
        e.preventDefault();
        handleMouseUp();
    }, [handleMouseUp]);

    // Handle clear canvas with socket emission
    const handleClearCanvas = useCallback(() => {
        clearCanvas();
        if (socket) {
            socket.emit('clear-canvas', { roomId });
        }
    }, [clearCanvas, socket, roomId]);

    // Download canvas as PNG
    const handleDownload = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, []);

    // Initialize canvas size and handle resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            const ctx = canvas.getContext('2d');
            
            // Save current canvas content
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Resize canvas
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // Fill with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Restore content (may be scaled/clipped)
            ctx.putImageData(imageData, 0, 0);
        };

        // Initial size
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Fill with white background
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ResizeObserver for handling resize
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleRemoteDrawLine = ({ prevPoint, currentPoint, color, width }) => {
            drawLine(prevPoint, currentPoint, color, width);
        };

        const handleRemoteClearCanvas = () => {
            clearCanvas();
        };

        socket.on('draw-line', handleRemoteDrawLine);
        socket.on('clear-canvas', handleRemoteClearCanvas);

        return () => {
            socket.off('draw-line', handleRemoteDrawLine);
            socket.off('clear-canvas', handleRemoteClearCanvas);
        };
    }, [socket, drawLine, clearCanvas]);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-white rounded-xl overflow-hidden">
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Floating Toolbar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl border border-slate-200/50">
                {/* Color Picker */}
                <div className="relative">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200 hover:border-slate-300 transition-colors"
                        title="Pick color"
                    />
                </div>

                <div className="w-px h-8 bg-slate-200" />

                {/* Thin Brush */}
                <Button
                    variant={tool === 'pen' && brushSize === 'thin' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => { setTool('pen'); setBrushSize('thin'); }}
                    className="rounded-xl h-10 w-10"
                    title="Thin brush"
                >
                    <Pencil className="h-5 w-5" />
                </Button>

                {/* Thick Brush */}
                <Button
                    variant={tool === 'pen' && brushSize === 'thick' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => { setTool('pen'); setBrushSize('thick'); }}
                    className="rounded-xl h-10 w-10"
                    title="Thick brush"
                >
                    <PenTool className="h-5 w-5" />
                </Button>

                {/* Eraser */}
                <Button
                    variant={tool === 'eraser' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setTool('eraser')}
                    className="rounded-xl h-10 w-10"
                    title="Eraser"
                >
                    <Eraser className="h-5 w-5" />
                </Button>

                <div className="w-px h-8 bg-slate-200" />

                {/* Clear Canvas */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearCanvas}
                    className="rounded-xl h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Clear canvas"
                >
                    <Trash2 className="h-5 w-5" />
                </Button>

                {/* Download */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="rounded-xl h-10 w-10 text-green-500 hover:text-green-600 hover:bg-green-50"
                    title="Download as PNG"
                >
                    <Download className="h-5 w-5" />
                </Button>
            </div>

            {/* Tool Indicator */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-xl shadow-lg rounded-lg border border-slate-200/50 text-sm text-slate-600">
                {tool === 'eraser' ? '🧹 Eraser' : `🖌️ ${brushSize === 'thin' ? 'Thin' : 'Thick'} Brush`}
                {tool === 'pen' && (
                    <span 
                        className="inline-block w-4 h-4 rounded-full ml-2 align-middle border border-slate-300"
                        style={{ backgroundColor: color }}
                    />
                )}
            </div>
        </div>
    );
};

export default Whiteboard;
