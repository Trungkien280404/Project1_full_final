import React, { useState, useEffect, useMemo } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';
import { PART_LABELS } from '../constants.js';

export default function Diagnose({ cart, addToCart, onNavigate }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [processedImage, setProcessedImage] = useState(null);

  useEffect(() => {
    Api.products().then(setProducts).catch(err => console.error("Lỗi tải sản phẩm:", err));
  }, []);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onDetect() {
    if (!file) return alert('Vui lòng chọn một ảnh để chẩn đoán.');
    setLoading(true);
    setResult(null);
    setProcessedImage(null);

    try {
      const r = await Api.diagnose(file);
      setResult(r);
      if (r.visual_output_base64) {
        setProcessedImage(`data:image/png;base64,${r.visual_output_base64}`);
      } else if (r.error) {
        alert(`Lỗi từ AI: ${r.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối đến server chẩn đoán.');
    } finally {
      setLoading(false);
    }
  }

  const suggestions = useMemo(() => {
    if (!result || !result.parts) return [];

    // 1. Lấy thông tin từ kết quả AI
    const detectedBrand = result.brand ? result.brand.toLowerCase() : '';
    // Chuẩn hóa tên bộ phận: loại bỏ dấu gạch ngang, khoảng trắng thừa
    const damagedParts = result.parts.map(p => p.label.toLowerCase().replace(/[-_]/g, ' ').trim());

    // Map từ khóa AI sang tiếng Việt để tìm trong tên sản phẩm
    // Ưu tiên từ khóa cụ thể (ví dụ: "cản trước") hơn từ khóa chung (ví dụ: "cản")
    const PART_KEYWORDS = {
      'bumper': ['bumper'],
      'front bumper': ['cản trước', 'front bumper', 'can truoc'],
      'back bumper': ['cản sau', 'rear bumper', 'can sau', 'back bumper'],
      'headlight': ['đèn pha', 'headlight', 'den pha'],
      'tail light': ['đèn hậu', 'tail light', 'den hau', 'đèn sau'],
      'door': ['door'],
      'front door': ['cửa trước', 'front door', 'cua truoc'],
      'back door': ['cửa sau', 'back door', 'cua sau'],
      'hood': ['nắp ca-pô', 'hood', 'nắp capo', 'capo', 'nap capo'],
      'trunk': ['cốp', 'trunk', 'cop'],
      'fender': ['vè', 'fender', 'tai xe', 've'],
      'mirror': ['gương', 'mirror', 'kính chiếu hậu', 'guong'],
      'windshield': ['kính chắn gió', 'windshield', 'kinh chan gio'],
      'wheel': ['bánh', 'mâm', 'wheel', 'banh', 'mam'],
      'tire': ['lốp', 'vỏ', 'tire', 'lop']
    };

    return products.filter(product => {
      const pName = product.name.toLowerCase();
      const pBrand = product.brand ? product.brand.toLowerCase() : '';
      const pPart = product.part ? product.part.toLowerCase() : '';

      // 2. Lọc theo Hãng xe (nếu AI nhận diện được)
      if (detectedBrand) {
        const brandMatch = pBrand.includes(detectedBrand) || pName.includes(detectedBrand);
        if (!brandMatch) return false;
      }

      // 3. Lọc theo Bộ phận bị hỏng
      return damagedParts.some(aiPart => {
        // a. Check khớp chính xác key part (nếu DB dùng key tiếng Anh cũ)
        if (pPart === aiPart) return true;

        // b. Check theo từ khóa tiếng Việt trong Tên sản phẩm
        const keywords = PART_KEYWORDS[aiPart] || [aiPart];

        // Kiểm tra xem có khớp với bất kỳ từ khóa nào không
        return keywords.some(kw => {
          // Tìm kiếm chính xác từ khóa trong tên sản phẩm
          // Ví dụ: "cản trước" phải match chính xác, không match "cản sau"
          return pName.includes(kw);
        });
      });
    });
  }, [result, products]);

  const cartItemCount = cart ? cart.reduce((acc, item) => acc + item.qty, 0) : 0;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <div className="text-xl font-semibold mb-3">Chẩn đoán từ ảnh</div>
        <div className="space-y-3">
          <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Button className="w-full bg-gray-900 text-white flex justify-center items-center" onClick={onDetect} disabled={loading}>
            {loading ? 'Đang phân tích...' : 'Nhận diện hư hỏng'}
          </Button>
          {preview && (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={preview} alt="Preview" className="w-full object-contain max-h-80" />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="text-xl font-semibold mb-3">Kết quả & Gợi ý</div>
        {!result && !loading && <p className="text-gray-500 text-sm">Vui lòng chọn ảnh và nhấn Nhận diện.</p>}
        {result && (
          <div className="space-y-4">
            {(result.brand || result.model) && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="text-xs text-blue-500 uppercase font-bold tracking-wider">Phương tiện được phát hiện</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {result.brand} {result.model}
                  </div>
                </div>
                <div className="relative cursor-pointer p-2" onClick={() => onNavigate('checkout')}>
                  <span className="text-2xl">🛒</span>
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                      {cartItemCount}
                    </span>
                  )}
                </div>
              </div>
            )}

            {processedImage ? (
              <div className="relative rounded-xl overflow-hidden border bg-gray-50">
                <img src={processedImage} alt="AI Result" className="w-full object-contain max-h-80" />
              </div>
            ) : (
              (result.parts || []).length > 0 && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200">
                  Không thể tạo ảnh mô phỏng, nhưng đã tìm thấy dữ liệu bên dưới.
                </div>
              )
            )}
            <div className="bg-gray-50 p-3 rounded-xl border">
              <div className="font-semibold text-sm mb-2">Chi tiết hư hỏng:</div>
              {(!result.parts || result.parts.length === 0) ? (
                <p className="text-sm text-green-600">Không phát hiện hư hỏng đáng kể nào.</p>
              ) : (
                <ul className="space-y-1">
                  {result.parts.map((item, idx) => (
                    <li key={idx} className="text-sm flex justify-between items-center border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                      <span>
                        <span className="font-bold text-red-600">{PART_LABELS[item.damage_type] || item.damage_type}</span>
                        {' '} tại {' '}
                        <span className="font-bold text-gray-800">{PART_LABELS[item.label] || item.label}</span>
                      </span>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{Math.round(item.conf * 100)}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold mb-2 flex items-center gap-2">🛒 Gợi ý phụ tùng thay thế</div>
              {suggestions.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Không tìm thấy phụ tùng phù hợp trong kho.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map(p => (
                    <div key={p.id} className="border rounded-xl overflow-hidden hover:shadow-md transition bg-white">
                      <div className="h-24 w-full bg-gray-100 relative">
                        <img src={p.image_path} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <div className="font-medium text-sm truncate" title={p.name}>{p.name}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{p.brand}</span>
                          <span className="text-sm font-bold text-blue-600">{p.price.toLocaleString()}₫</span>
                        </div>
                        <button
                          className="w-full mt-2 text-xs bg-gray-900 text-white py-1.5 rounded-lg hover:bg-gray-700 transition"
                          onClick={() => addToCart(p)}
                        >
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}