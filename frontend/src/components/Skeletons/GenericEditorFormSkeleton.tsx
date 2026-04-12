export const GenericEditorFormSkeleton = () => (
    <div className="editor-form">
        {/* Header */}
        <div className="editor-form__header">
            <div className="skeleton square header-logo" />
            <div className="column">
                <div className="skeleton text long" />
                <div className="skeleton text short" style={{ marginTop: '0.4rem' }} />
            </div>
        </div>

        <div className="editor-form__divider" />

        {/* Content */}
        <div className="editor-form__content">
            {/* Section label */}
            <div className="skeleton text short" style={{ width: '15%' }} />

            {/* Row 1: two fields */}
            <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <div className="skeleton text short" style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <div className="skeleton text max-width" />
                </div>
                <div style={{ flex: 1 }}>
                    <div className="skeleton text short" style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <div className="skeleton text max-width" />
                </div>
            </div>

            {/* Row 2: two fields */}
            <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <div className="skeleton text short" style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <div className="skeleton text max-width" />
                </div>
                <div style={{ flex: 1 }}>
                    <div className="skeleton text short" style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <div className="skeleton text max-width" />
                </div>
            </div>

            {/* Salary row: 4 fields */}
            <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
                {['20%', '30%', '30%', '20%'].map((w, i) => (
                    <div key={i} style={{ flex: 1 }}>
                        <div className="skeleton text max-width" style={{ width: w }} />
                    </div>
                ))}
            </div>

            {/* Section label */}
            <div className="skeleton text short" style={{ width: '15%', marginTop: '1.5rem' }} />

            {/* Skills rows */}
            <div className="skeleton-text-group" style={{ marginTop: '1rem' }}>
                {new Array(3).fill(null).map((_, i) => (
                    <div key={i} className="row" style={{ gap: '1rem' }}>
                        <div className="skeleton text max-width" />
                        <div className="skeleton text max-width" style={{ width: '30%' }} />
                        <div className="skeleton text short" style={{ width: '5%' }} />
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="editor-form__footer">
            <div className="skeleton text short" style={{ width: '5rem', borderRadius: '6px' }} />
            <div className="skeleton text short" style={{ width: '5rem', borderRadius: '6px' }} />
        </div>
    </div>
);