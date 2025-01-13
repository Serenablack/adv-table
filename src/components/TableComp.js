import { useEffect, useState } from "react";

export const TableComp = () => {
  const [originalData, setOriginalData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [filterValues, setFilterValues] = useState({
    year: { min: "", max: "" },
    revenue: { min: "", max: "" },
    netIncome: { min: "", max: "" },
  });
  const [filterType, setFilterType] = useState("");
  const [range, setRange] = useState({ min: "", max: "" });
  const [sortOrder, setSortOrder] = useState({
    date: null,
    revenue: null,
    netIncome: null,
  });

  useEffect(() => {
    fetchData();
    const savedFilters = JSON.parse(localStorage.getItem("filters")) || {};
    setFilterType(savedFilters.filterType || "");
    setRange(savedFilters.range || { min: "", max: "" });
    setSortOrder(
      savedFilters.sortOrder || { date: null, revenue: null, netIncome: null }
    );
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/income-statement/AAPL?period=annual&apikey=${process.env.REACT_APP_API_KEY}`
      );

      const data = await response.json();
      setOriginalData(data);
      setDisplayData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const saveFilters = (filters) => {
    localStorage.setItem("filters", JSON.stringify(filters));
  };

  const handleSorting = (key) => {
    const newOrder = sortOrder[key] === "asc" ? "desc" : "asc";
    const sorted = [...displayData].sort((a, b) => {
      if (key === "date") {
        return newOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else {
        return newOrder === "asc" ? a[key] - b[key] : b[key] - a[key];
      }
    });
    setDisplayData(sorted);
    setSortOrder({ ...sortOrder, [key]: newOrder });
    saveFilters({
      filterType,
      range,
      sortOrder: { ...sortOrder, [key]: newOrder },
    });
  };

  const applyFilter = () => {
    if (!filterType) return alert("Please select a filter type.");

    const filtered = displayData.filter((item) => {
      const value =
        filterType === "year"
          ? new Date(item.date).getFullYear()
          : item[filterType];

      if (range.min && value < range.min) return false;
      if (range.max && value > range.max) return false;
      return true;
    });

    setFilterValues((prevValues) => ({
      ...prevValues,
      [filterType]: range,
    }));

    setDisplayData(filtered);
    saveFilters({ filterType, range, sortOrder });
  };

  const handleRemoveFilter = (type) => {
    const updatedFilterValues = {
      ...filterValues,
      [type]: { min: "", max: "" },
    };
    setFilterValues(updatedFilterValues);

    if (type === filterType) {
      setFilterType("");
      setRange({ min: "", max: "" });
    }

    const filteredData = applyRemainingFilters(updatedFilterValues);
    setDisplayData(filteredData);
  };

  const applyRemainingFilters = (updatedFilterValues) => {
    let filteredData = originalData;

    Object.keys(updatedFilterValues).forEach((key) => {
      const { min, max } = updatedFilterValues[key];
      if (min || max) {
        filteredData = filteredData.filter((item) => {
          const value =
            key === "year" ? new Date(item.date).getFullYear() : item[key];
          if (min && value < min) return false;
          if (max && value > max) return false;
          return true;
        });
      }
    });

    return filteredData;
  };

  const clearFilter = () => {
    setFilterType("");
    setRange({ min: "", max: "" });
    setFilterValues({
      year: { min: "", max: "" },
      revenue: { min: "", max: "" },
      netIncome: { min: "", max: "" },
    });
    setDisplayData(originalData);
    localStorage.removeItem("filters");
  };

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="w-full mx-auto bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Financial Data Table</h3>

        <div className="flex flex-wrap flex-end gap-4 mb-6 justify-end">
          <select
            className="dropdown-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);

              setRange(filterValues[e.target.value] || { min: "", max: "" });
            }}>
            <option value="">Select Filter Type</option>
            <option className="text-gray-600" value="year">
              Year
            </option>
            <option value="revenue" className="text-gray-800">
              Revenue
            </option>
            <option className="text-gray-800" value="netIncome">
              Net Income
            </option>
          </select>
          <input
            type="number"
            className="input-field"
            placeholder="Min Value"
            value={range.min}
            onChange={(e) => setRange({ ...range, min: e.target.value })}
            disabled={!filterType}
          />
          <input
            type="number"
            className="input-field"
            placeholder="Max Value"
            value={range.max}
            onChange={(e) => setRange({ ...range, max: e.target.value })}
            disabled={!filterType}
          />
          <button className="btn-primary" onClick={applyFilter}>
            Apply Filter
          </button>
          <button className="btn-danger" onClick={clearFilter}>
            Clear Filter
          </button>
        </div>
        <div>
          {Object.keys(filterValues).map((key) => {
            const { min, max } = filterValues[key];
            if (min && max) {
              return (
                <button
                  key={key}
                  className="mr-2 mb-2 inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-sm text-gray-800 hover:bg-gray-200">
                  {key}: {min} - {max}
                  <span
                    onClick={() => handleRemoveFilter(key)}
                    className="ml-2 cursor-pointer text-red-500 font-bold">
                    ✖
                  </span>
                </button>
              );
            }
            return null;
          })}
        </div>
        <div className=" divider"></div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-100 bg-white">
            <thead className="table-header">
              <tr>
                <th
                  className="table-row-header cursor-pointer"
                  onClick={() => handleSorting("date")}>
                  Date{" "}
                  {sortOrder.date === "asc"
                    ? "▲"
                    : sortOrder.date === "desc"
                    ? "▼"
                    : ""}
                </th>
                <th
                  className="table-row-header cursor-pointer"
                  onClick={() => handleSorting("revenue")}>
                  Revenue{" "}
                  {sortOrder.revenue === "asc"
                    ? "▲"
                    : sortOrder.revenue === "desc"
                    ? "▼"
                    : ""}
                </th>
                <th
                  className="table-row-header cursor-pointer"
                  onClick={() => handleSorting("netIncome")}>
                  Net Income{" "}
                  {sortOrder.netIncome === "asc"
                    ? "▲"
                    : sortOrder.netIncome === "desc"
                    ? "▼"
                    : ""}
                </th>
                <th className="table-row-header">Gross Profit</th>
                <th className="table-row-header">EPS</th>
                <th className="table-row-header">Operating Income</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr key={index}>
                  <td className="table-cell">{item.date}</td>
                  <td className="table-cell">${item.revenue}</td>
                  <td className="table-cell">${item.netIncome}</td>
                  <td className="table-cell">${item.grossProfit}</td>
                  <td className="table-cell">{item.eps}</td>
                  <td className="table-cell">${item.operatingIncome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
