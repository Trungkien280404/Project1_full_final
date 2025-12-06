import React, { useState } from 'react';
import { Api } from '../api.js';
import Button from './Button.jsx';
import Input from './Input.jsx';
import Toast from './Toast.jsx';
import { Spinner, IconEmail, IconLock, IconUser, IconEye, IconEyeOff } from './Icons.jsx';

// Component Nút Tab tùy chỉnh
const TabBtn = ({ active, children, onClick }) => (
    <button
        className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ease-in-out border 
            ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-300/50'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
            }`
        }
        onClick={onClick}
    >
        {children}
    </button>
);

export default function AuthModal({ onClose, onLogin }) {
    const [tab, setTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [fpStep, setFpStep] = useState(1);
    const [fpCode, setFpCode] = useState('');
    const [fpNew, setFpNew] = useState('');
    const [fpConfirm, setFpConfirm] = useState('');
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Client-side validation helpers
    const isValidEmail = (email) => {
        // Regex chặt chẽ hơn: TLD phải ít nhất 2 ký tự
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    };

    const checkEmailTypo = (email) => {
        const commonDomains = {
            'gmail.com': [
                'gmaih.com', 'gmaul.com', 'gmial.com', 'gmeil.com', 'gmai.com',
                'gmall.com', 'gmil.com', 'gmaill.com', 'gnail.com', 'gmal.com',
                'gamil.com', 'gmaiil.com', 'gmailo.com'
            ],
            'yahoo.com': ['yaho.com', 'yahooo.com', 'yhoo.com', 'yhaoo.com', 'yahou.com'],
            'outlook.com': ['outlok.com', 'outloo.com', 'outlookk.com', 'outluk.com'],
            'hotmail.com': ['hotmial.com', 'hotmal.com', 'hotmaii.com', 'hotmil.com', 'homail.com'],
        };

        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return null;

        for (const [correct, typos] of Object.entries(commonDomains)) {
            if (typos.includes(domain)) {
                return `Email có vẻ sai. Bạn có muốn dùng @${correct}?`;
            }
        }
        return null;
    };

    const isStrongPassword = (pwd) => {
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return pwd.length >= 6 && hasUpperCase && hasSpecialChar;
    };

    function showToast(type, text) {
        setToast({ type, text });
    }

    function clearToast() {
        setToast(null);
    }

    async function submitLogin() {
        // Frontend validation
        if (!email || !isValidEmail(email)) {
            return showToast('error', 'Email không đúng định dạng');
        }
        if (!password) {
            return showToast('error', 'Vui lòng nhập mật khẩu');
        }

        setLoading(true);
        clearToast();
        const data = await Api.login(email, password);

        if (data?.token) {
            showToast('success', '✅ Đăng nhập thành công!');
            setTimeout(() => {
                onLogin(data);
                onClose();
            }, 800);
        } else {
            showToast('error', data?.message || 'Đăng nhập không thành công');
        }

        setLoading(false);
    }

    async function submitRegister() {
        // Frontend validation
        if (!name || name.trim().length < 2) {
            return showToast('error', 'Vui lòng nhập họ tên (ít nhất 2 ký tự)');
        }
        if (!email || !isValidEmail(email)) {
            return showToast('error', 'Email không đúng định dạng');
        }

        const typoWarning = checkEmailTypo(email);
        if (typoWarning) {
            return showToast('warning', typoWarning);
        }

        if (!password || password.length < 6) {
            return showToast('error', 'Mật khẩu phải có ít nhất 6 ký tự');
        }
        if (!isStrongPassword(password)) {
            return showToast('error', 'Mật khẩu phải có ít nhất 1 chữ IN HOA và 1 ký tự đặc biệt (!@#$%...)');
        }

        setLoading(true);
        clearToast();
        const data = await Api.register(name, email, password);

        if (data?.token) {
            showToast('success', '🎉 Đăng ký thành công!');
            setTimeout(() => {
                onLogin(data);
                onClose();
            }, 800);
        } else {
            showToast('error', data?.message || 'Đăng ký không thành công');
        }

        setLoading(false);
    }

    async function fpSendCode() {
        try {
            if (!email || !isValidEmail(email)) return showToast('error', 'Vui lòng nhập email đúng định dạng');
            setLoading(true); clearToast();
            const r = await Api.forgot(email);
            showToast('success', r?.message || 'Nếu email tồn tại, mã đã được gửi.');
            setFpStep(2);
        } catch {
            showToast('error', 'Không thể gửi mã. Thử lại sau.');
        } finally { setLoading(false); }
    }

    async function fpVerify() {
        try {
            if (!email || !fpCode) return showToast('error', 'Nhập email và mã xác minh');
            setLoading(true); clearToast();
            const r = await Api.verifyReset(email, fpCode);
            if (r?.ok) {
                setVerified(true);
                showToast('success', 'Mã hợp lệ. Bạn có thể đặt mật khẩu mới.');
            } else {
                setVerified(false);
                showToast('error', r?.message || 'Mã không đúng hoặc đã hết hạn.');
            }
        } catch {
            setVerified(false);
            showToast('error', 'Không thể xác minh mã.');
        } finally { setLoading(false); }
    }

    async function fpReset() {
        try {
            if (!verified) return showToast('error', 'Bạn cần xác minh mã trước');
            if (!fpNew || fpNew.length < 6) return showToast('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            if (!isStrongPassword(fpNew)) return showToast('error', 'Mật khẩu phải có ít nhất 1 chữ IN HOA và 1 ký tự đặc biệt');
            if (fpNew !== fpConfirm) return showToast('error', 'Xác nhận mật khẩu không khớp');
            setLoading(true); clearToast();
            const r = await Api.reset(email, fpCode, fpNew);
            if (r?.ok && r?.token) {
                showToast('success', 'Đổi mật khẩu thành công. Đang đăng nhập…');
                setTimeout(() => {
                    onLogin({ token: r.token, user: r.user });
                    onClose();
                }, 800);
            } else {
                showToast('error', r?.message || 'Đổi mật khẩu thất bại');
            }
        } catch {
            showToast('error', 'Không thể đổi mật khẩu');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 md:pt-20">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.text}
                    onClose={clearToast}
                    duration={4000}
                />
            )}

            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-sm md:max-w-md mx-4 transition-all duration-300">
                <div className="rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-gray-900/20 p-6 sm:p-8">

                    {/* Header Logo/Title */}
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        <span className="text-blue-600">Auto</span>Parts Portal
                    </h2>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                        <TabBtn active={tab === 'login'} onClick={() => { setTab('login'); clearToast(); setShowPassword(false); }}>Đăng nhập</TabBtn>
                        <TabBtn active={tab === 'register'} onClick={() => { setTab('register'); clearToast(); setShowPassword(false); }}>Đăng ký</TabBtn>
                        {tab === 'forgot' && (
                            <TabBtn active={true} onClick={() => { }}>Mật khẩu mới</TabBtn>
                        )}
                    </div>

                    {/* LOGIN Tab */}
                    {tab === 'login' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><IconEmail /></span>
                                <Input
                                    className="w-full !pl-10 h-12"
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                    onKeyPress={e => e.key === 'Enter' && submitLogin()}
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><IconLock /></span>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full !pl-10 h-12"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading}
                                    onKeyPress={e => e.key === 'Enter' && submitLogin()}
                                />
                                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>

                            {/* Nút Quên mật khẩu */}
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:underline font-medium"
                                    onClick={() => { setTab('forgot'); setFpStep(1); setVerified(false); clearToast(); setShowPassword(false); }}
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <Button className="w-full h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-semibold" onClick={submitLogin} disabled={loading}>
                                {loading ? <Spinner className="w-5 h-5" /> : 'Đăng nhập'}
                            </Button>
                        </div>
                    )}

                    {/* REGISTER Tab */}
                    {tab === 'register' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><IconUser /></span>
                                <Input className="w-full !pl-10 h-12" placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><IconEmail /></span>
                                <Input className="w-full !pl-10 h-12" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><IconLock /></span>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full !pl-10 h-12"
                                    placeholder="Mật khẩu (chữ HOA + ký tự đặc biệt)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading}
                                    onKeyPress={e => e.key === 'Enter' && submitRegister()}
                                />
                                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>

                            {/* Password hint */}
                            <p className="text-xs text-gray-500">
                                💡 Mật khẩu mạnh: Tối thiểu 6 ký tự, có chữ IN HOA và ký tự đặc biệt (!@#$...)
                            </p>

                            <Button className="w-full h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-semibold" onClick={submitRegister} disabled={loading}>
                                {loading ? <Spinner className="w-5 h-5" /> : 'Tạo tài khoản'}
                            </Button>
                        </div>
                    )}

                    {/* FORGOT PASSWORD Tab */}
                    {tab === 'forgot' && (
                        <div className="space-y-4">
                            {fpStep === 1 && (
                                <>
                                    <div className="text-sm text-gray-600">Nhập email để nhận mã đặt lại mật khẩu.</div>
                                    <Input className="w-full h-12" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                                    <Button className="w-full h-12 flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 font-semibold" onClick={fpSendCode} disabled={loading}>
                                        {loading ? <Spinner className="w-5 h-5" /> : 'Gửi mã xác minh'}
                                    </Button>
                                </>
                            )}
                            {fpStep === 2 && (
                                <>
                                    <div className="text-sm text-gray-600">Mã xác minh đã gửi tới **{email}** (hết hạn sau 15 phút).</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="md:col-span-2">
                                            <Input className="w-full h-12" placeholder="Mã xác minh" value={fpCode} onChange={e => setFpCode(e.target.value)} />
                                        </div>
                                        <Button variant="outline" className={`h-12 flex items-center justify-center ${verified ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`} onClick={fpVerify} disabled={loading}>
                                            {loading && !verified ? <Spinner className="w-5 h-5" /> : (verified ? 'Đã xác minh' : 'Xác minh')}
                                        </Button>
                                    </div>

                                    <Input type="password" className="w-full h-12" placeholder="Mật khẩu mới (chữ HOA + ký tự đặc biệt)" value={fpNew} onChange={e => setFpNew(e.target.value)} disabled={!verified || loading} />
                                    <Input type="password" className="w-full h-12" placeholder="Xác nhận mật khẩu mới" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} disabled={!verified || loading} />

                                    <Button className="w-full h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-semibold" onClick={fpReset} disabled={loading || !verified}>
                                        {loading ? <Spinner className="w-5 h-5" /> : 'Đổi mật khẩu'}
                                    </Button>

                                    <button className="block mx-auto text-sm text-blue-600 hover:underline" onClick={() => { setFpStep(1); setVerified(false); clearToast(); }}>
                                        Gửi lại mã
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                        <Button variant="outline" className="text-gray-600 hover:bg-gray-100" onClick={onClose}>Đóng</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
