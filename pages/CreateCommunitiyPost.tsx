import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const CreateCommunityPost: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<'all' | 'subs'>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateAiSpark = async () => {
    setIsAiDrafting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Draft a high-energy community update for a creator to their fans. Focus on 'exclusive BTS content' and 'upcoming tour rumors'. 1 sentence only.",
      });
      setContent(response.text?.trim() || "");
    } catch (e) {
      setContent("Rumor has it something big is dropping. Stay tuned for exclusive BTS content this weekend! 🌌");
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handlePublish = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div>
      <header>
        <button onClick={() => navigate(-1)}>
          <span>close</span>
        </button>
        <h1>Compose Post</h1>
        <button 
          onClick={handlePublish}
          disabled={!content.trim() || isPosting}
         
        >
          {isPosting ? 'Sending...' : 'Publish'}
        </button>
      </header>

      <main>
        {/* Editor Area */}
        <section>
          <div>
             <div>
                <div>
                   <img src="https://picsum.photos/seed/mila/100" alt="" />
                </div>
                <div>
                   <p>Mila Ray</p>
                   <p>Posting to Galaxy</p>
                </div>
             </div>
             <button 
                onClick={generateAiSpark}
                disabled={isAiDrafting}
               
             >
                <span>auto_awesome</span>
                AI Draft
             </button>
          </div>

          <div>
             <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
              
               placeholder="What's happening in your universe?"
             />
          </div>

          {attachedImage && (
            <div>
               <img src={attachedImage} alt="Attachment" />
               <button 
                onClick={() => setAttachedImage(null)}
               
               >
                 <span>close</span>
               </button>
            </div>
          )}
        </section>

        {/* Toolbar */}
        <section>
           <div>
              <button 
                onClick={() => fileInputRef.current?.click()}
               
              >
                 <span>image</span>
                 <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
              </button>
              <button>
                 <span>poll</span>
              </button>
              <button>
                 <span>schedule</span>
              </button>
           </div>
           
           <div>
              <button 
                onClick={() => setTargetAudience('all')}
               
              >
                Public
              </button>
              <button 
                onClick={() => setTargetAudience('subs')}
               
              >
                <span>stars</span>
                Subs Only
              </button>
           </div>
        </section>
      </main>
    </div>
  );
};

export default CreateCommunityPost;
