import React, { useState } from "react";
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HiAtSymbol } from "react-icons/hi";
import { AiFillLinkedin } from "react-icons/ai";
import styles from './styles/ContactPage.module.css';
import LoaderAnimation from "../../components/common/LoadingAnitmation.jsx";
 

const ContactUs = () =>{
    const[formData, setFormData] = useState({
        name:'',
        email:'',
        subject:'',
        message:'',
    });
 
    const[status, setStatus] = useState({
        loading: false,
        error: null,
        success: null,
    });

    const handleChange = (e) =>{
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setStatus({ loading: true, error: null, success: null });

        try{
            const res = await axios.post('/api/auth/support', formData);
            setStatus({ loading: false, error: null, success: 'Message successfully sent!'});
            setFormData({ name:'', email:'', message:'' });
        }catch (err){
            setStatus({
                loading: false,
                error: 'Something went wrong. Please try again later...',
                success: null,
            });
        }
    };

    return(
        <div className={styles['contactPage-container']}>
            <h1>Contact us!</h1>
            <div className={styles['contact']}>
                <p>You found your way into the contact page, so I guess you have some questions
                    or are in need of some kind of support?
                </p>
                <p>Maybe you just want to join us at Ailuminate and be a member of the Ailuminate platform?
                    As a member of Ailuminate you get to create a researcher account to create your own quizzes
                    {/* Add some more here!! */}. 
                </p>
                <p>To register click here: <Link to='/register'>Signup!</Link></p>
            </div>

            <div className={styles['support-card']}>
                <h2>Ailuminate Support</h2>
                <p>If you do have some questions, feedback or want to contact us for some other reason, 
                    here are our contact info or submit the form down below and we will contact you as fast as we can.
                </p>
                    <div className={styles['support']}>
                        <div>
                            <img 
                                className={styles['profile-picture']}
                                src='/Profile_img_blondhair.png' 
                                alt='A profile picture of a blond haired girl in a cartoony stile' />
                            <h3>Madeleine</h3>
                            <p><HiAtSymbol />Email: <a href='mailto:madela@stud.ntnu.no'>madela@stud.ntnu.no</a></p>
                            <p><AiFillLinkedin />LinkedIn:</p>
                        </div>
                        <div>
                            <img 
                                className={styles['profile-picture']}
                                src='/Profile_img_brownhair.png' 
                                alt='A profile picture of a brown haired girl with big glasses in a cartoony stile' />
                            <h3>Emilie</h3>
                            <p><HiAtSymbol />Email: <a href='mailto:emilirol@stud.ntnu.no'>emilirol@stud.ntnu.no</a></p>
                            <p><AiFillLinkedin />LinkedIn: <a href='https://www.linkedin.com/in/emilie-rolstad-788778248/' target='_blank'>Emilie on LinkedIn</a></p>
                        </div>
                    </div>

                <form 
                    className={styles['contact-form']}
                    onSubmit={handleSubmit}
                >
                    <h2>Send us a message</h2>
                    <p>Fill out the form, and we will contact you as soon as possible</p>
                    <label>Name<span className={styles['required-star']}> *</span></label>
                    <input 
                        type='text' 
                        name='name'
                        placeholder='Your Name Here!'
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <label>Email<span className={styles['required-star']}> *</span></label>
                    <input 
                        type='email'
                        name='email'
                        placeholder='Your Email Here!'
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <label>Subject<span className={styles['required-star']}> *</span></label>
                    <select
                        name='subject'
                        value={formData.subject}
                        onChange={handleChange}
                        required
                    >
                        <option value=''>Select a subject</option>
                        <option value='General Inquiry'>General Inquiry</option>
                        <option value='Technical Support'>Technical Support</option>
                        <option value='Feedback'>Feedback</option>
                        <option value='Accounts'>Accounts</option>
                        <option value='Other'>Other</option>
                    </select>
                    <label>Message<span className={styles['required-star']}> *</span></label>
                    <textarea
                        name='message'
                        placeholder='Write your message here!'
                        value={formData.message}
                        onChange={handleChange}
                        required
                    />
                    <p>When sending this form you agree to: Ailuminate processes your information
                        to be able to answer your inquiry
                    </p>
                    <button
                        className={styles['submitBtn']}
                        type='submit'
                        disabled={status.loading}
                    >
                        {status.loading ? <LoaderAnimation /> : 'Submit'}
                    </button>
                    {status.error && <p>{status.error}</p>}
                    {status.success && <p>{status.sucess}</p>}
                </form>
            </div>
        </div> 
    );
};

export default ContactUs;