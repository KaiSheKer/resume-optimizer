export default function TestPage() {
  return (
    <div style={{
      backgroundColor: '#F9F9F8',
      padding: '20px',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1A1A1A' }}>样式测试页面</h1>
      <button style={{
        backgroundColor: '#D97757',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px'
      }}>
        测试按钮
      </button>
      <p style={{ color: '#585858' }}>如果你能看到暖色背景和橙色按钮,说明样式系统正常工作</p>
    </div>
  );
}
