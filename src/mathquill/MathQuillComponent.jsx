import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { addStyles, EditableMathField } from 'react-mathquill';

// Pre-inject styles
addStyles();

const MathQuillComponent = ({ node, updateAttributes, deleteNode }) => {
  const { latex: initialLatex } = node.attrs;
  const [latex, setLatex] = useState(initialLatex || '');
  const [mathField, setMathField] = useState(null);

  const handleChange = (field) => {
    const newLatex = field.latex();
    setLatex(newLatex);
    updateAttributes({ latex: newLatex });
  };

  const insertSymbol = (symbol) => {
    if (mathField) {
      mathField.cmd(symbol);
      mathField.focus();
    }
  };



  const symbols = [
    { label: 'x²', cmd: '^2' },
    { label: 'xⁿ', cmd: '^' },
    { label: '√', cmd: '\\sqrt' },
    { label: '¾', cmd: '\\frac' },
    { label: 'π', cmd: '\\pi' },
    { label: 'θ', cmd: '\\theta' },
    { label: '∞', cmd: '\\infty' },
    { label: '±', cmd: '\\pm' },
    { label: '∫', cmd: '\\int' },
    { label: 'Δ', cmd: '\\Delta' },
  ];

  const deleteBlock = () => {
    if (window.confirm("Are you sure you want to delete this math block?")) {
      deleteNode();
    }
  };

  return (
    <NodeViewWrapper className="mathquill-block">
      <div className="mathquill-container" style={{ margin: '8px 0', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>

        {/* Symbol toolbar + delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {symbols.map((s, i) => (
              <button
                key={i}
                onClick={() => insertSymbol(s.cmd)}
                title={s.cmd}
                style={{
                  padding: '2px 6px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  opacity: 0.75,
                  transition: 'opacity 0.15s, background 0.15s'
                }}
                onMouseOver={(e) => { e.target.style.opacity = 1; e.target.style.background = 'var(--bg-hover)'; }}
                onMouseOut={(e) => { e.target.style.opacity = 0.75; e.target.style.background = 'transparent'; }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={deleteBlock}
            title="Delete block"
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px 4px', transition: 'color 0.15s' }}
            onMouseOver={(e) => e.target.style.color = '#ef4444'}
            onMouseOut={(e) => e.target.style.color = '#888'}
          >
            ×
          </button>
        </div>

        {/* Math input area */}
        <div style={{ padding: '10px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '48px', display: 'flex', alignItems: 'center' }}>
          <EditableMathField
            latex={latex}
            onChange={handleChange}
            mathquillDidMount={(field) => setMathField(field)}
            style={{ minWidth: '120px', width: '100%', border: 'none', fontSize: '1.4rem', color: 'var(--text-primary)' }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default MathQuillComponent;
