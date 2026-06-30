import React, { useState } from 'react';
import { Mail, Phone, User, Award, Percent, BookOpen, Star, CheckCircle, Sparkles, Send } from 'lucide-react';
import { Member } from '../types';

interface MemberRegisterProps {
  onRegister: (member: { name: string; email: string; phone: string }) => Promise<{ status: string; code?: string; message?: string }>;
}

export const MemberRegister: React.FC<MemberRegisterProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessCode(null);

    if (!formData.name.trim() || formData.name.length < 3) {
      setErrorMsg('يرجى إدخال اسم ثلاثي صالح للانضمام للنادي');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صالح لإرسال العروض وهدية الترحيب الفورية');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setErrorMsg('يرجى كتابة رقم جوال صالح للتواصل السريع');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      if (res.status === 'success' && res.code) {
        setSuccessCode(res.code);
        setFormData({ name: '', email: '', phone: '' });
      } else {
        setErrorMsg(res.message || 'عذراً، فشل التسجيل حالياً، يرجى إعادة المحاولة');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-stone-900 text-stone-100 rounded-3xl overflow-hidden shadow-2xl border border-gold-600/30 grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side: Information */}
        <div className="p-8 md:p-12 bg-radial from-stone-900 to-stone-950 flex flex-col justify-between border-b md:border-b-0 md:border-l border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-gold-400 mb-4">
              <Sparkles className="animate-pulse" size={20} />
              <span className="text-xs uppercase tracking-widest font-black">نادي النخبة للخط العربي</span>
            </div>
            
            <h2 className="font-serif text-3xl font-black text-white mb-4 leading-tight">
              انضم إلينا اليوم واحصل على مزايا حصرية تليق بك
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              يسرنا دعوتكم للانضمام إلى عضوية مجتمعنا المتخصص بالخط العربي والزخرفة الإسلامية لتستفيد من مزايا وتخفيضات خاصة جداً بأعضاء النخبة.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0">
                  <Percent size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-200 text-sm">كوبون ترحيبي فوري</h4>
                  <p className="text-stone-400 text-xs mt-0.5">خصم فوري 10% يُطبق تلقائياً على طلبك القادم بالمتجر.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-200 text-sm">أولوية حجز اللوحات الخاصة</h4>
                  <p className="text-stone-400 text-xs mt-0.5">كن أول من يعلم بصدور اللوحات والمخطوطات اليدوية الأصلية الفريدة من ورشة الخطاط.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-200 text-sm">دعوات مجانية للورش التدريبية</h4>
                  <p className="text-stone-400 text-xs mt-0.5">الحصول على مقاعد مجانية في دورات الخط العربي والزخرفة التي يقيمها الخطاط دورياً.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-stone-500 pt-8 mt-8 border-t border-stone-800">
            العضوية مجانية بالكامل ومخصصة لعشاق الحرف العربي والزخرفة الإسلامية الفاخرة.
          </div>
        </div>

        {/* Right Side: Signup Form / Success Screen */}
        <div className="p-8 md:p-12 bg-white text-stone-900 flex flex-col justify-center">
          {successCode ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-50">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">أهلاً بك في نادي النخبة!</h3>
                <p className="text-stone-500 text-xs mt-1.5">
                  لقد سجلت في العضوية بنجاح. إليك كود الخصم الترحيبي الحصري الخاص بك:
                </p>
              </div>

              {/* Promo Code Card */}
              <div className="p-5 bg-gold-50 border border-gold-200 rounded-2xl max-w-xs mx-auto text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold text-gold-600 tracking-wider block mb-1">انسخ الكود المالي</span>
                <span className="font-mono text-2xl font-black text-stone-950 tracking-widest">{successCode}</span>
                <p className="text-[10px] text-stone-400 mt-2">يعطيك خصم 10% على كل اللوحات في المتجر حالاً.</p>
              </div>

              <p className="text-xs text-stone-400">
                تم إرسال رسالة ترحيبية وتأكيد كود الخصم لبريدك الإلكتروني المعتمد.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">سجل بياناتك للانضمام</h3>
                <p className="text-stone-500 text-xs mt-1">يرجى ملء الحقول لتفعيل الكود الخاص بك فوراً</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">اسمك الكريم:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="الاسم الثنائي أو الثلاثي"
                    className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl text-xs outline-none focus:border-gold-500 bg-stone-50"
                  />
                  <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">البريد الإلكتروني المفضل:</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                    className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl text-xs outline-none focus:border-gold-500 bg-stone-50"
                  />
                  <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-stone-700 text-xs font-bold mb-1.5">رقم جوالك الشخصي:</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="رقم الهاتف للتواصل"
                    className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-xl text-xs outline-none focus:border-gold-500 bg-stone-50 animate-none"
                  />
                  <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-stone-950 hover:bg-stone-900 text-gold-400 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-75 cursor-pointer text-xs"
              >
                {isSubmitting ? (
                  <>جاري الانضمام وإرسال الكوبون...</>
                ) : (
                  <>
                    <Send size={14} />
                    <span>انضم الآن واحصل على كوبون الخصم</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
