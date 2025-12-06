import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import { Spinner } from './Icons.jsx';

export default function ProductDetail({ productId, addToCart, onBack, onNavigate }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    // Tư vấn form data
    const [consultName, setConsultName] = useState('');
    const [consultPhone, setConsultPhone] = useState('');

    // Review data
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        if (!productId) return;
        setLoading(true);
        // Load product detail and reviews
        Promise.all([
            Api.productDetail(productId),
            Api.getReviews(productId).catch(() => [])
        ])
            .then(([prodData, reviewsData]) => {
                setProduct(prodData);
                setReviews(reviewsData);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [productId]);

    const handleConsult = async () => {
        if (!consultName.trim() || !consultPhone.trim()) {
            return alert("Vui lòng nhập họ tên và số điện thoại.");
        }
        try {
            await Api.submitConsultation({ product_id: product.id, name: consultName, phone: consultPhone });
            alert("Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất!");
            setConsultName('');
            setConsultPhone('');
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };

    const handleReviewSubmit = async () => {
        if (!newReview.comment.trim()) return alert("Vui lòng nhập nội dung đánh giá");
        try {
            const addedReview = await Api.addReview({
                product_id: product.id,
                rating: parseInt(newReview.rating),
                comment: newReview.comment
            });
            setReviews([addedReview, ...reviews]);
            setNewReview({ rating: 5, comment: '' });
            alert("Cảm ơn bạn đã đánh giá!");
        } catch (e) {
            console.error(e);
            if (e.message && (e.message.includes("401") || e.message.toLowerCase().includes("unauthorized"))) {
                if (confirm("Bạn cần đăng nhập để đánh giá. Đăng nhập ngay?")) {
                    window.location.reload();
                }
            } else {
                alert("Gửi đánh giá thất bại. Vui lòng đăng nhập và thử lại.");
            }
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;
    if (!product) return <div className="text-center p-10">Không tìm thấy sản phẩm</div>;

    // Helper render sao
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>★</span>
        ));
    };

    return (
        <div className="animate-fade-in pb-10">
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-blue-600 mb-4 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Quay lại
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 p-6">
                    {/* Left: Images */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <img
                                src={product.image_path}
                                alt={product.name}
                                className="w-full h-full object-contain p-4 mix-blend-multiply"
                                onError={(e) => { e.target.src = 'https://placehold.co/600x600?text=No+Image' }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="aspect-square bg-gray-50 rounded-md border border-gray-100 cursor-pointer hover:border-blue-400 transition">
                                    <img src={`https://placehold.co/150?text=Img+${i + 1}`} className="w-full h-full object-cover opacity-50 hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <div className="mb-4">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide">
                                {product.brand}
                            </span>
                            <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-2">{product.name}</h1>
                            <div className="text-sm text-gray-500 mb-4 flex items-center gap-4">
                                <span>SKU: <span className="font-medium text-gray-700">{`SKU-${product.id}`}</span></span>
                                <span className="text-gray-300">|</span>
                                <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                                </span>
                            </div>
                        </div>

                        <div className="text-3xl font-bold text-blue-600 mb-6">
                            {Number(product.price) > 0 ? `${Number(product.price).toLocaleString()} ₫` : 'Liên hệ'}
                        </div>

                        <div className="flex gap-4 mb-8">
                            <button
                                className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95"
                                onClick={() => {
                                    if (product.stock > 0) {
                                        addToCart(product);
                                        alert('Đã thêm vào giỏ hàng!');
                                    } else {
                                        alert('Sản phẩm tạm hết hàng');
                                    }
                                }}
                                disabled={product.stock <= 0}
                            >
                                {product.stock > 0 ? 'THÊM VÀO GIỎ' : 'HẾT HÀNG'}
                            </button>
                            <button className="px-4 border border-blue-200 rounded-xl hover:bg-blue-50 text-blue-600 transition">
                                ❤️
                            </button>
                        </div>

                        {/* Consultation Form */}
                        <div className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                            <div className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                                📞 Cần tư vấn thêm?
                            </div>
                            <div className="text-xs text-slate-500 mb-4">Để lại thông tin, chúng tôi sẽ gọi lại ngay.</div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tên của bạn..."
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={consultName}
                                    onChange={e => setConsultName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="SĐT..."
                                    className="w-1/3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={consultPhone}
                                    onChange={e => setConsultPhone(e.target.value)}
                                />
                                <button
                                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition shadow-sm"
                                    onClick={handleConsult}
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>

                        {/* Policies */}
                        <div className="mt-8 space-y-3">
                            {[
                                "Bảo hành chính hãng 12 tháng",
                                "Đổi trả trong vòng 7 ngày nếu lỗi",
                                "Miễn phí vận chuyển đơn > 5tr",
                                "Hỗ trợ lắp đặt tận nơi (TP.HCM)"
                            ].map((policy, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {policy}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs / Bottom Section */}
                <div className="border-t border-gray-100">
                    <div className="px-6 py-8">
                        {/* Description */}
                        <div className="mb-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">Mô tả sản phẩm</h3>
                            <div
                                className="prose prose-sm max-w-none text-gray-600 product-description"
                                dangerouslySetInnerHTML={{ __html: product.description || '<p class="italic text-gray-400">Chưa có mô tả chi tiết cho sản phẩm này.</p>' }}
                            />
                        </div>

                        {/* Specifications */}
                        <div className="mb-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">Thông số kỹ thuật</h3>
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                {product.specifications && typeof product.specifications === 'object' ? (
                                    <div className="space-y-4">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="border-b border-gray-200 last:border-0 pb-4">
                                                <div className="font-bold text-gray-800 text-base mb-2 uppercase tracking-wide bg-blue-50 inline-block px-2 py-1 rounded">
                                                    {key}
                                                </div>
                                                <div className="text-gray-700 text-sm pl-2">
                                                    {typeof value === 'object' && value !== null ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {Object.entries(value).map(([subKey, subValue]) => (
                                                                <div key={subKey} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-l-2 border-gray-300 pl-3 py-1">
                                                                    <span className="font-semibold text-gray-600 min-w-[120px]">{subKey}:</span>
                                                                    <span className="text-gray-900 font-medium whitespace-pre-wrap">
                                                                        {typeof subValue === 'object' ? JSON.stringify(subValue) : String(subValue)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span>{String(value)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                        {typeof product.specifications === 'string' ? product.specifications : "Đang cập nhật..."}
                                    </pre>
                                )}
                            </div>
                        </div>

                        {/* Reviews & Comments - NEW SECTION */}
                        <div id="reviews">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3 flex justify-between items-center">
                                <span>Đánh giá & Bình luận ({reviews.length})</span>
                            </h3>

                            {/* Review Input */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                                <div className="font-semibold text-gray-800 mb-3">Viết đánh giá của bạn</div>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Chọn mức độ:</span>
                                    <div className="flex gap-1 cursor-pointer">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span
                                                key={star}
                                                className={`text-2xl hover:scale-110 transition ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                                    value={newReview.comment}
                                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                                        onClick={handleReviewSubmit}
                                    >
                                        Gửi đánh giá
                                    </button>
                                </div>
                            </div>

                            {/* Review List */}
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8 italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
                                ) : (
                                    reviews.map((r, idx) => (
                                        <div key={r.id || idx} className="border-b border-gray-100 pb-4 last:border-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                    {r.user_name}
                                                    <span className="text-yellow-400 text-sm">{renderStars(r.rating)}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <p className="text-gray-600 text-sm">{r.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
