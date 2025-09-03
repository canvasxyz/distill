import './App.css'

function App() {

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h2>All tweets 💬</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li>Included 👍</li>
          <li>Excluded 👎</li>
          <li>Offensive 🤬</li>
          <li>NSFW 🔞</li>
          <li>Beef 🐄</li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: '10px' }}>
        {/* Main content controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button>Select all</button>
          <button style={{ backgroundColor: 'green', color: 'white' }}>Include</button>
          <button style={{ backgroundColor: 'red', color: 'white' }}>Exclude</button>
        </div>

        {/* Tweet card container */}
        <div>
          {/* Excluded Tweet Card */}
          <div style={{ border: '1px solid red', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ margin: 0 }}>"I find people who go to McDonald's to be absolutely disgusting"</p>
              <span style={{ color: 'red' }}>excluded</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button style={{ marginRight: '10px' }}>X</button>
              <span>Offensive</span>
            </div>
          </div>

          {/* Included Tweet Card */}
          <div style={{ border: '1px solid green', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ margin: 0 }}>"Good morning! The weather in Amsterdam is beautiful right now."</p>
              <span style={{ color: 'green' }}>included</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
              <input type="checkbox" style={{ marginRight: '10px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
