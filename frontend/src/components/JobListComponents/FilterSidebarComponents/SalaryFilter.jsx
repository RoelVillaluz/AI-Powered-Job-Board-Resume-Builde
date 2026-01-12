const SalaryFilter = ({ min, max, onChange }) => {
    <div>
        <h4>Salary Range</h4>
        <div className="min-max-container">
            <div>
                <label htmlFor="min-salary">MIN</label>
                <input 
                    type="number" 
                    id="min-salary"
                    value={min ?? ''} 
                    onChange={(e) => onChange("salary", e.target.value, "min")}
                    placeholder="0"
                />
            </div>
            <div>
                <label htmlFor="max-salary">MAX</label>
                <input 
                    type="number" 
                    id="max-salary"
                    value={max ?? ''}
                    onChange={(e) => onChange("salary", e.target.value, "max")}
                    placeholder="200000"
                />
            </div>
        </div>
    </div>
}

export default SalaryFilter