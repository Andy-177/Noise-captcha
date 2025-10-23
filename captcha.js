class CaptchaVerifier {
    constructor(options = {}) {
        // 默认配置，包含详细的噪声参数
        this.options = {
            buttonText: '点击验证',
            buttonClass: '',
            onVerify: () => {},
            
            // 噪声相关参数，可直接调整
            noiseFactor: 0.70,    // 噪声因子，值越大噪声越明显 (0.1-1.5)
            maxNoise: 700,        // 最大噪声值，值越大噪声影响越强 (100-1000)
            dotCount: 300,        // 干扰点数量，值越大干扰点越多 (50-300)
            lineCount: 6.0,       // 干扰线数量，值越大干扰线越多 (1-6)
            characterRotation: 1, // 字符旋转角度，值越大旋转越明显 (0.1-0.6)
            characterOffset: 20,  // 字符位置偏移，值越大偏移越明显 (5-20)
            
            ...options
        };
        
        // 创建验证码按钮
        this.createButton();
        
        // 创建验证码容器（初始隐藏）
        this.createCaptchaContainer();
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 创建验证码按钮
    createButton() {
        this.button = document.createElement('button');
        this.button.textContent = this.options.buttonText;
        this.button.className = `captcha-btn ${this.options.buttonClass}`;
        this.button.style.padding = '8px 16px';
        this.button.style.backgroundColor = '#3b82f6';
        this.button.style.color = 'white';
        this.button.style.border = 'none';
        this.button.style.borderRadius = '6px';
        this.button.style.cursor = 'pointer';
        this.button.style.fontSize = '14px';
        this.button.style.transition = 'all 0.2s';
        
        // 添加悬停效果
        this.button.addEventListener('mouseover', () => {
            this.button.style.backgroundColor = '#2563eb';
        });
        
        this.button.addEventListener('mouseout', () => {
            this.button.style.backgroundColor = '#3b82f6';
        });
        
        // 找到带有captcha属性的元素，将按钮插入到该元素中
        const captchaElements = document.querySelectorAll('[captcha]');
        if (captchaElements.length > 0) {
            captchaElements[0].appendChild(this.button);
        } else {
            // 如果没有找到，默认添加到body
            document.body.appendChild(this.button);
        }
    }
    
    // 创建验证码容器
    createCaptchaContainer() {
        // 遮罩层
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.overlay.style.display = 'none';
        this.overlay.style.justifyContent = 'center';
        this.overlay.style.alignItems = 'center';
        this.overlay.style.zIndex = '9999';
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.3s ease';
        
        // 验证码容器
        this.container = document.createElement('div');
        this.container.className = 'captcha-container';
        this.container.style.background = 'white';
        this.container.style.padding = '28px';
        this.container.style.borderRadius = '12px';
        this.container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        this.container.style.width = '100%';
        this.container.style.maxWidth = '400px';
        this.container.style.boxSizing = 'border-box';
        this.container.style.transform = 'scale(0.9)';
        this.container.style.transition = 'transform 0.3s ease';
        
        // 验证提示头部
        const header = document.createElement('div');
        header.className = 'verification-header';
        header.style.marginBottom = '20px';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon';
        iconDiv.style.width = '24px';
        iconDiv.style.height = '24px';
        iconDiv.style.backgroundColor = '#3b82f6';
        iconDiv.style.color = 'white';
        iconDiv.style.borderRadius = '50%';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.justifyContent = 'center';
        iconDiv.style.marginRight = '10px';
        iconDiv.innerHTML = '<i class="fa fa-shield"></i>';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'title';
        titleDiv.style.fontSize = '18px';
        titleDiv.style.fontWeight = '600';
        titleDiv.style.color = '#1f2937';
        titleDiv.textContent = '检验你是否为机器人';
        
        header.appendChild(iconDiv);
        header.appendChild(titleDiv);
        
        // 验证码画布
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'captcha-canvas';
        this.canvas.width = 340;
        this.canvas.height = 150;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '150px';
        this.canvas.style.background = '#f3f4f6';
        this.canvas.style.border = '1px solid #e5e7eb';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.transition = 'all 0.2s ease';
        
        // 输入和操作按钮容器
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-actions';
        inputContainer.style.marginTop = '18px';
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '12px';
        inputContainer.style.alignItems = 'center';
        
        // 输入框
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.id = 'captcha-input';
        this.input.placeholder = '请输入验证码';
        this.input.style.flex = '1';
        this.input.style.padding = '11px 15px';
        this.input.style.border = '1px solid #d1d5db';
        this.input.style.borderRadius = '6px';
        this.input.style.fontSize = '16px';
        this.input.style.transition = 'all 0.2s ease';
        
        // 刷新按钮
        this.refreshBtn = document.createElement('button');
        this.refreshBtn.id = 'refresh-btn';
        this.refreshBtn.title = '刷新验证码';
        this.refreshBtn.innerHTML = '<i class="fa fa-refresh"></i>';
        this.refreshBtn.style.width = '44px';
        this.refreshBtn.style.height = '44px';
        this.refreshBtn.style.padding = '0';
        this.refreshBtn.style.border = 'none';
        this.refreshBtn.style.borderRadius = '6px';
        this.refreshBtn.style.cursor = 'pointer';
        this.refreshBtn.style.fontSize = '16px';
        this.refreshBtn.style.transition = 'all 0.2s ease';
        this.refreshBtn.style.display = 'flex';
        this.refreshBtn.style.alignItems = 'center';
        this.refreshBtn.style.justifyContent = 'center';
        this.refreshBtn.style.background = '#3b82f6';
        this.refreshBtn.style.color = 'white';
        
        // 验证按钮
        this.verifyBtn = document.createElement('button');
        this.verifyBtn.id = 'verify-btn';
        this.verifyBtn.title = '验证';
        this.verifyBtn.innerHTML = '<i class="fa fa-check"></i>';
        this.verifyBtn.style.width = '44px';
        this.verifyBtn.style.height = '44px';
        this.verifyBtn.style.padding = '0';
        this.verifyBtn.style.border = 'none';
        this.verifyBtn.style.borderRadius = '6px';
        this.verifyBtn.style.cursor = 'pointer';
        this.verifyBtn.style.fontSize = '16px';
        this.verifyBtn.style.transition = 'all 0.2s ease';
        this.verifyBtn.style.display = 'flex';
        this.verifyBtn.style.alignItems = 'center';
        this.verifyBtn.style.justifyContent = 'center';
        this.verifyBtn.style.background = '#10b981';
        this.verifyBtn.style.color = 'white';
        this.verifyBtn.style.fontWeight = '500';
        
        // 结果消息
        this.resultMessage = document.createElement('div');
        this.resultMessage.id = 'result-message';
        this.resultMessage.style.marginTop = '14px';
        this.resultMessage.style.padding = '10px 14px';
        this.resultMessage.style.borderRadius = '6px';
        this.resultMessage.style.fontSize = '15px';
        this.resultMessage.style.display = 'none';
        this.resultMessage.style.border = '1px solid transparent';
        
        // 组装元素
        inputContainer.appendChild(this.input);
        inputContainer.appendChild(this.refreshBtn);
        inputContainer.appendChild(this.verifyBtn);
        
        this.container.appendChild(header);
        this.container.appendChild(this.canvas);
        this.container.appendChild(inputContainer);
        this.container.appendChild(this.resultMessage);
        
        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);
        
        // 获取2D上下文
        this.ctx = this.canvas.getContext('2d');
        this.currentCode = ''; // 当前验证码内容
    }
    
    // 绑定事件
    bindEvents() {
        // 按钮点击显示验证码
        if (this.button) {
            this.button.addEventListener('click', () => this.show());
        }
        
        // 刷新按钮事件
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.refreshCode());
        }
        
        // 验证按钮事件
        if (this.verifyBtn) {
            this.verifyBtn.addEventListener('click', () => this.verifyCode());
        }
        
        // 支持回车键验证
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyCode();
                }
            });
        }
        
        // 点击验证码图片刷新
        if (this.canvas) {
            this.canvas.addEventListener('click', () => this.refreshCode());
        }
        
        // 点击遮罩层关闭
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide(false);
                }
            });
        }
    }
    
    // 显示验证码
    show() {
        if (!this.overlay || !this.container) return;
        
        this.overlay.style.display = 'flex';
        // 触发动画
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            this.container.style.transform = 'scale(1)';
        }, 10);
        
        // 初始化验证码
        this.refreshCode();
        if (this.input) this.input.focus();
    }
    
    // 隐藏验证码
    hide(result) {
        if (!this.overlay || !this.container) return;
        
        this.overlay.style.opacity = '0';
        this.container.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            // 调用回调函数
            if (typeof this.options.onVerify === 'function') {
                this.options.onVerify(result);
            }
        }, 300);
    }
    
    // 生成随机4-8位长度
    getRandomLength() {
        return Math.floor(Math.random() * 5) + 4;
    }
    
    // 生成验证码
    generateCode(length) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += Math.floor(Math.random() * 10);
        }
        return code;
    }
    
    // 绘制验证码
    drawCode(code) {
        if (!this.ctx) return;
        
        // 清空画布
        this.ctx.fillStyle = '#f3f4f6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制干扰线
        this.drawLines(this.options.lineCount);
        
        // 设置文字样式
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 计算文字位置
        const codeLength = code.length;
        const totalWidth = codeLength * 40;
        const startX = (this.canvas.width - totalWidth) / 2;
        
        // 绘制每个字符
        for (let i = 0; i < codeLength; i++) {
            const fontSize = codeLength > 6 ? 46 : 56;
            this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            
            // 文字颜色
            const color = `rgb(${10 + Math.random() * 30}, ${10 + Math.random() * 30}, ${10 + Math.random() * 30})`;
            this.ctx.fillStyle = color;
            
            // 位置偏移和旋转角度（使用配置的参数）
            const x = startX + i * 40 + (Math.random() * 7 - 3.5);
            const y = this.canvas.height / 2 + (Math.random() * this.options.characterOffset - this.options.characterOffset / 2);
            const rotate = (Math.random() * this.options.characterRotation - this.options.characterRotation / 2);
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotate);
            this.ctx.fillText(code[i], 0, 0);
            this.ctx.restore();
        }
        
        // 添加噪声
        this.addNoise();
        
        // 绘制干扰点
        this.drawDots(this.options.dotCount);
    }
    
    // 绘制干扰线
    drawLines(count) {
        if (!this.ctx) return;
        
        for (let i = 0; i < count; i++) {
            this.ctx.strokeStyle = `rgb(${130 + Math.random() * 75}, ${130 + Math.random() * 75}, ${130 + Math.random() * 75})`;
            this.ctx.lineWidth = 1 + Math.random() * 1.12;
            
            this.ctx.beginPath();
            this.ctx.moveTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
            this.ctx.lineTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    // 绘制干扰点
    drawDots(count) {
        if (!this.ctx) return;
        
        for (let i = 0; i < count; i++) {
            this.ctx.fillStyle = `rgb(${100 + Math.random() * 105}, ${100 + Math.random() * 105}, ${100 + Math.random() * 105})`;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = 0.68 + Math.random() * 1.35;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 添加噪声
    addNoise() {
        if (!this.ctx) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // 使用配置的噪声参数
            const noiseR = (Math.random() * 2 - 1) * this.options.maxNoise * this.options.noiseFactor;
            const noiseG = (Math.random() * 2 - 1) * this.options.maxNoise * this.options.noiseFactor;
            const noiseB = (Math.random() * 2 - 1) * this.options.maxNoise * this.options.noiseFactor;
            
            data[i] = Math.max(0, Math.min(255, data[i] + noiseR));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseG));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseB));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    // 刷新验证码
    refreshCode() {
        if (!this.canvas) return;
        
        // 添加刷新动画
        this.canvas.style.opacity = '0.6';
        setTimeout(() => {
            const length = this.getRandomLength();
            this.currentCode = this.generateCode(length);
            this.drawCode(this.currentCode);
            this.canvas.style.opacity = '1';
        }, 200);
        
        // 重置输入和结果
        if (this.input) this.input.value = '';
        if (this.resultMessage) this.resultMessage.style.display = 'none';
    }
    
    // 验证验证码
    verifyCode() {
        if (!this.input || !this.verifyBtn || !this.resultMessage) return;
        
        const userInput = this.input.value.trim();
        
        if (!userInput) {
            this.showResult('请输入验证码', 'warning');
            return;
        }
        
        if (!/^\d+$/.test(userInput)) {
            this.showResult('请输入有效的数字', 'warning');
            return;
        }
        
        // 添加验证中状态
        this.verifyBtn.disabled = true;
        this.verifyBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
        
        // 模拟验证延迟
        setTimeout(() => {
            if (userInput === this.currentCode) {
                this.showResult('验证成功，你已通过机器人验证', 'success');
                // 验证成功后关闭并返回结果
                setTimeout(() => this.hide(true), 1000);
            } else {
                this.showResult('验证失败，请重新输入', 'error');
                // 失败后刷新验证码
                setTimeout(() => this.refreshCode(), 1200);
            }
            
            // 恢复按钮状态
            this.verifyBtn.disabled = false;
            if (userInput !== this.currentCode) {
                this.verifyBtn.innerHTML = '<i class="fa fa-check"></i>';
            }
        }, 500);
    }
    
    // 显示结果信息
    showResult(message, type) {
        if (!this.resultMessage) return;
        
        this.resultMessage.textContent = message;
        this.resultMessage.style.display = 'block';
        this.resultMessage.className = ''; // 清除所有类
        
        if (type === 'success') {
            this.resultMessage.style.background = '#ecfdf5';
            this.resultMessage.style.color = '#059669';
            this.resultMessage.style.borderColor = '#a7f3d0';
        } else if (type === 'error') {
            this.resultMessage.style.background = '#fee2e2';
            this.resultMessage.style.color = '#dc2626';
            this.resultMessage.style.borderColor = '#fecaca';
        } else {
            this.resultMessage.style.background = '#fffbeb';
            this.resultMessage.style.color = '#d97706';
            this.resultMessage.style.borderColor = '#fde68a';
        }
    }
}

// 修改：使用无参数初始化，确保使用JS中的默认配置
document.addEventListener('DOMContentLoaded', () => {
    // 移除自定义参数，使用默认配置
    new CaptchaVerifier();
});
    