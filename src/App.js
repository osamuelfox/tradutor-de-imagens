import React, { useState, useCallback } from 'react';

// Ícones do Lucide React para uma UI mais limpa
const UploadCloud = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
  </svg>
);

const FileText = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const Languages = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="m7 2 5 5" /><path d="m12 18 4 4 6-6" /><path d="M12 14h12" />
  </svg>
);


export default function App() {
  // Estados para gerenciar a imagem, textos, idioma, carregamento e erros
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Lista de idiomas para tradução
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese'
  ];

  // Função para converter arquivo em base64
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  // Manipulador para seleção de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setExtractedText('');
      setTranslatedText('');
      setError('');
    }
  };

  // Função para chamar a API Gemini
  const callGeminiAPI = useCallback(async (prompt, imageData = null) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // A chave da API será injetada pelo ambiente
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${}`;

    let parts = [{ text: prompt }];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData
        }
      });
    }

    const payload = {
      contents: [{ role: "user", parts: parts }],
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Resposta da API inválida ou vazia.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      return null;
    }
  }, []);

  // Função principal para processar a imagem
  const handleProcessImage = useCallback(async () => {
    if (!image) {
      setError('Por favor, selecione uma imagem primeiro.');
      return;
    }

    setIsLoading(true);
    setError('');
    setExtractedText('');
    setTranslatedText('');

    try {
      // 1. Converter imagem para base64
      const base64ImageData = await toBase64(image);

      // 2. Extrair texto da imagem
      const extractionPrompt = "Extraia o texto desta imagem. Responda apenas com o texto extraído.";
      const extracted = await callGeminiAPI(extractionPrompt, base64ImageData);

      if (extracted) {
        setExtractedText(extracted);

        // 3. Traduzir o texto extraído
        const translationPrompt = `Traduza o seguinte texto para ${targetLanguage}: "${extracted}"`;
        const translated = await callGeminiAPI(translationPrompt);

        if (translated) {
          setTranslatedText(translated);
        } else {
          setError('Falha ao traduzir o texto. O texto extraído pode estar vazio ou a tradução falhou.');
        }
      } else {
        setError('Falha ao extrair texto da imagem.');
      }
    } catch (err) {
      setError(`Ocorreu um erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [image, targetLanguage, callGeminiAPI]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Tradutor de Imagens</h1>
          <p className="text-lg text-slate-600 mt-2">Envie uma imagem, extraia o texto e traduza-o instantaneamente.</p>
        </header>

        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Coluna de Upload e Pré-visualização */}
            <div className="flex flex-col space-y-6">
              <h2 className="text-2xl font-semibold text-slate-700 border-b pb-2">1. Envie sua Imagem</h2>
              <div
                className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-100 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Pré-visualização" className="max-h-60 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48">
                    <UploadCloud className="w-12 h-12 text-slate-400 mb-2" />
                    <p className="text-slate-500">
                      <span className="font-semibold text-blue-600">Clique para enviar</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF, etc.</p>
                  </div>
                )}
              </div>

              {/* Seleção de Idioma e Botão de Ação */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-700 border-b pb-2">2. Selecione o Idioma</h2>
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleProcessImage}
                  disabled={!image || isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : 'Extrair e Traduzir Texto'}
                </button>

                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
              </div>

            </div>

            {/* Coluna de Resultados */}
            <div className="flex flex-col space-y-6">
              {/* Texto Extraído */}
              <div className="flex-1 flex flex-col">
                <h2 className="text-2xl font-semibold text-slate-700 flex items-center"><FileText className="w-6 h-6 mr-2" />Texto Extraído</h2>
                <div className="mt-2 p-4 bg-slate-100 rounded-lg h-48 overflow-y-auto border border-slate-200 flex-1">
                  <p className="text-slate-700 whitespace-pre-wrap">{extractedText || "O texto da imagem aparecerá aqui..."}</p>
                </div>
              </div>

              {/* Texto Traduzido */}
              <div className="flex-1 flex flex-col">
                <h2 className="text-2xl font-semibold text-slate-700 flex items-center"><Languages className="w-6 h-6 mr-2" />Texto Traduzido</h2>
                <div className="mt-2 p-4 bg-slate-100 rounded-lg h-48 overflow-y-auto border border-slate-200 flex-1">
                  <p className="text-slate-700 whitespace-pre-wrap">{translatedText || "A tradução aparecerá aqui..."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>Desenvolvido com React e Gemini API.</p>
        </footer>
      </div>
    </div>
  );
}
