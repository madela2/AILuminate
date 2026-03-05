// This search bar component code is similar to Madeleine and Emilie's search bar component in 
// assignment 2 in idg2001 cloud technologies

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/SearchBar.module.css';
import axios from 'axios';
import { HiSearch } from "react-icons/hi";
import LoaderAnimation from './LoadingAnitmation.jsx';

const SearchBar = () =>{
    const[query, setQuery] = useState('');
    const[results, setResults] = useState([]);
    const[isSearching, setIsSearching] = useState(false);
    const[isLoading, setIsLoading] = useState(false);
    const[error, setError] = useState(null);
    // Ref: for detecting clicks outside the results container
    const resultsRef = useRef(null);

    // Clicking outside the searchbar, closes the search results
    useEffect(() =>{
        function handleClickOutside(event){
            if(resultsRef.current && !resultsRef.current.contains(event.target)){
                setIsSearching(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return() =>{
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, []);

    const handleInputChanges = (e) =>{
        const value = e.target.value;
        setQuery(value);

        if(window.searchTimeout){
            clearTimeout(window.searchTimeout);
        }

        if(value.trim()){
            window.searchTimeout = setTimeout(() =>{
                handleSearch(value);
            }, 500)
        }else{
            setResults([]);
            setIsSearching(false);
        }
    };

    const handleSubmit = (e) =>{
        e.preventDefault();
        if(query.trim()){
            handleSearch(query);
        }
    };

    const handleSearch = async (searchQuery) =>{
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setIsSearching(true);
        setError(null);

        try{
            const res = await axios.get('/api/users/search', { 
                params: { query: searchQuery },
                withCredentials: true
            });

            const data = res.data;

            if(Array.isArray(data)){
                setResults(data);
            }else if(typeof data === 'object' && data !== null){
                setResults([data]);
            }else{
                setResults([]);
                setError('Invalid data received from API');
            }
        }catch (err){
            setError('No users found or an error occurred');
            setResults([]);
        }finally{
            setIsLoading(false);
        }
    };
    
    return(
        <div className={styles['searchbar-container']} ref={resultsRef}>
            <div className={styles['searchbar']}>
                <form 
                    className={styles['searchbar-form']}
                    onSubmit={handleSubmit}
                >
                    <input
                        className={styles['search-input']}
                        type='text'
                        placeholder='Search for username or @email'
                        value={query}
                        onChange={handleInputChanges}
                    />
                    <button 
                        className={styles['searchBtn']}
                        type='submit'
                    >
                        <HiSearch  className={styles['search-icon']}/>
                    </button>
                </form>
            </div>

            {isLoading && <LoaderAnimation />}

            {isSearching && !isLoading && results.length > 0 && (
                <ul className={styles['results-list']}>
                    {results.map((item, index) =>(
                        <li 
                            key={index}
                            className={styles['results-item']}
                        >
                            <Link to={`/profile/${item._id}`}>
                                <p>Username: <strong>{item.username}</strong></p>
                                <p>{item.email}</p> 
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {isSearching && !isLoading && query.trim() && results.length === 0 && (
                <div className={styles['no-results']}>
                    {error || `No results found for ${query}`}
                </div>
            )} 
        </div>
    );
};

export default SearchBar;