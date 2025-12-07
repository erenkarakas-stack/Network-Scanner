import { GoogleGenAI } from "@google/genai";
import { NetworkDevice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeNetworkSecurity = async (devices: NetworkDevice[], subnet: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Filter data to reduce token count and focus on important metrics
    const simplifiedData = devices.map(d => ({
      ip: d.ip,
      mac: d.mac,
      type: d.type,
      vendor: d.vendor,
      openPorts: d.openPorts.map(p => `${p.port}/${p.service}`),
      risk: d.securityRisk
    }));

    const prompt = `
      Sen uzman bir Siber Güvenlik Analistisin. Aşağıda taranan bir yerel ağın (${subnet}) cihaz listesi verilmiştir.
      
      Görevlerin:
      1. Ağdaki en kritik güvenlik açıklarını tespit et (Örn: Açık RDP, SMB portları, bilinmeyen IoT cihazları).
      2. Şüpheli cihazları belirt (Örn: Garip portları açık olan telefonlar).
      3. Ağ yöneticisi için Türkçe dilinde kısa, net ve eyleme geçirilebilir bir özet rapor yaz.
      4. Listeyi markdown formatında, vurgulayıcı başlıklarla sun.

      Veri:
      ${JSON.stringify(simplifiedData, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.4, // Lower temperature for more analytical output
      }
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Ağ analizi sırasında bir hata oluştu. Lütfen API anahtarınızı kontrol edin.";
  }
};