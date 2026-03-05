import { Link } from 'react-router-dom';

const PageNotFound = () =>{

    return(
        <div style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist!</p>
            <div style={{ margin: '50px' }}>
                <Link to={'/'}>
                    <img src='/Ailuminate_icon.png' alt='The Ailuminate Icon' style={{ width:'50px' }}/> 
                    Go back to to Ailuminate
                </Link>
            </div>
        </div>
    );

};

export default PageNotFound;
