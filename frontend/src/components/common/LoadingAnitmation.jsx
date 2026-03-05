// Found a loading pizza on the web page https://css-loaders.com
// A free page with a lot of css code for copying.

// We added the text to defying the loading and make it clearer

import React from 'react';
import styles from './styles/LoadingAnimation.module.css';

const LoaderAnimation = () =>{
    return(
        <>
            <div className={styles['loader']}></div>
            <p className={styles['loader-text']}>Loading...</p>
        </>
    );
};

export default LoaderAnimation;