function Search({ searchKey, setSearchKey }) {
    return (
        <input
            type="text"
            placeholder="Search users..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="search-input"
        />
    );
}

export default Search;
