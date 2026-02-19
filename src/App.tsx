import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Upload, FileText, BarChart3, Zap, Loader, ServerCrash, ChevronLeft, ChevronRight } from 'lucide-react';

// Define the states of the application
type AppState = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!image) return;

    setAppState('loading');
    setAnalysis('');
    setError('');
    setCurrentSlide(0);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
          },
        };
      };

      const model = 'gemini-flash-latest'; // Using a cost-effective and fast model
      const generativeModel = ai.models;

      const prompt = `
        ในฐานะนักออกแบบ Presentation และนักวิเคราะห์การเงิน กำลังสร้างสไลด์สำหรับผู้บริหารในรูปแบบที่คล้ายกับ Canva
        โปรดวิเคราะห์ภาพงบการเงินและสร้าง "เนื้อหา" สำหรับสไลด์ 3 หน้าเป็นภาษาไทย โดยใช้ตัวคั่น ---SLIDE_BREAK--- ระหว่างแต่ละสไลด์อย่างชัดเจน

        สำหรับแต่ละสไลด์ ให้มีโครงสร้างดังนี้:

        **[แนะนำไอคอน/ภาพประกอบที่เหมาะสม เช่น 📊, 📈, 🔮]**
        
        ### **[หัวข้อสไลด์ที่ชัดเจน]**
        
        *   [เนื้อหาหลักในรูปแบบ Bullet Point ที่กระชับและเข้าใจง่าย]
        
        ---SLIDE_BREAK---
        
        **ตัวอย่างสไลด์ที่ 1: ภาพรวม**
        **ไอคอน: 📊**
        ### **ภาพรวมสรุปสำหรับผู้บริหาร**
        *   **ประเภทเอกสาร:** งบกำไรขาดทุน ประจำปี 256X
        *   **ไฮไลท์:** รายได้รวมเติบโต 15% แตะ 120 ล้านบาท
        
        ---SLIDE_BREAK---
        
        **ตัวอย่างสไลด์ที่ 2: เจาะลึก**
        **ไอคอน: 📈**
        ### **เจาะลึกผลการดำเนินงาน (KPIs)**
        *   **อัตรากำไรสุทธิ:** อยู่ที่ 12% แสดงถึงความสามารถในการทำกำไรที่ดี
        *   **อัตราส่วนสภาพคล่อง:** 1.8 เท่า บ่งชี้ว่าบริษัทมีสภาพคล่องแข็งแกร่ง
        
        ---SLIDE_BREAK---
        
        **ตัวอย่างสไลด์ที่ 3: อนาคต**
        **ไอคอน: 🔮**
        ### **ทิศทางและข้อเสนอแนะ**
        *   **แนวโน้ม:** คาดการณ์ว่ารายได้จะเติบโตต่อเนื่องในไตรมาสหน้า
        *   **ข้อเสนอแนะ:** มุ่งเน้นการลงทุนด้านการตลาดดิจิทัลเพื่อขยายฐานลูกค้า
      `;

      const imagePart = await fileToGenerativePart(image);

      const result = await generativeModel.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
      });

      const text = result.text;

      if (text) {
        setAnalysis(text);
        setAppState('success');
      } else {
        throw new Error('Analysis failed: The API returned an empty response.');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred during analysis.');
      setAppState('error');
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <div className="text-center p-8">
            <Loader className="animate-spin h-12 w-12 mx-auto text-violet-600" />
            <p className="mt-4 text-lg font-semibold">Analyzing your document...</p>
            <p className="text-slate-500">This may take a moment. We're extracting insights for you.</p>
          </div>
        );
      case 'success': {
        const slides = analysis.split('---SLIDE_BREAK---').filter(s => s.trim() !== '');
        if (slides.length === 0) {
            return (
                <div className="text-center p-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <ServerCrash className="h-12 w-12 mx-auto text-yellow-500" />
                    <p className="mt-4 text-lg font-semibold text-yellow-700">No Content</p>
                    <p className="text-yellow-600">The analysis returned an empty result. Please try a different image.</p>
                </div>
            );
        }

        return (
          <div>
            <div className="aspect-[16/9] bg-white rounded-xl shadow-lg p-8 md:p-12 border flex items-center justify-center">
                <div className="prose prose-violet max-w-none w-full">
                    <Markdown>{slides[currentSlide]}</Markdown>
                </div>
            </div>
            {slides.length > 1 && (
                <div className="flex items-center justify-center mt-4 gap-4">
                    <button 
                        onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                        disabled={currentSlide === 0}
                        className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <p className="font-medium text-slate-700">
                        Slide {currentSlide + 1} of {slides.length}
                    </p>
                    <button 
                        onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
                        disabled={currentSlide === slides.length - 1}
                        className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            )}
          </div>
        );
      }
      case 'error':
        return (
            <div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-xl">
                <ServerCrash className="h-12 w-12 mx-auto text-red-500" />
                <p className="mt-4 text-lg font-semibold text-red-700">Analysis Failed</p>
                <p className="text-red-600">{error}</p>
            </div>
        );
      case 'idle':
      default:
        return (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
            <FileText className="h-12 w-12 mx-auto text-slate-400" />
            <h3 className="mt-2 text-lg font-medium">Your analysis will appear here</h3>
            <p className="mt-1 text-sm text-slate-500">Upload an image of a financial document to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto grid gap-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Financial Statement Analyzer
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Upload a financial document, and get an executive-ready presentation in seconds.
          </p>
        </header>

        {/* Upload and Control Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <div className="grid sm:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-violet-200 rounded-xl p-6 text-center bg-violet-50/50 hover:bg-violet-50 transition-colors">
                    <Upload className="h-10 w-10 text-violet-500 mb-2" />
                    <label htmlFor="file-upload" className="relative cursor-pointer font-semibold text-violet-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-600 focus-within:ring-offset-2 hover:text-violet-500">
                        <span>{image ? 'Change file' : 'Upload a file'}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    {image && <p className='mt-2 text-sm font-medium text-slate-700 truncate'>{image.name}</p>}
                </div>

                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-slate-800">Ready to Analyze?</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Once your file is selected, click the button to start the AI-powered analysis.</p>
                    <button
                        onClick={handleAnalyzeClick}
                        disabled={!image || appState === 'loading'}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {appState === 'loading' ? 
                            <><Loader className="animate-spin -ml-1 mr-3 h-5 w-5" /> Processing...</> : 
                            <><Zap className="-ml-1 mr-2 h-5 w-5" /> Analyze Now</>
                        }
                    </button>
                </div>
            </div>
        </div>

        {/* Analysis Result Section */}
        <main>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-violet-600" />
            Generated Analysis
          </h2>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
