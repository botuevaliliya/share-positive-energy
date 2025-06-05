import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../api/apiConfig';
import useAuth from '../../hooks/useAuth';
import Feedback from './Feedback';
import './Wall.css';
import { useParams } from 'react-router-dom';
// import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const DraggableDiv = ({ children, initialPos }) => {
    const [position, setPosition] = useState(initialPos);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setDragging(true);
        setOffset({
            x: e.clientX - position.left,
            y: e.clientY - position.top,
        });
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            setPosition({
                left: e.clientX - offset.x,
                top: e.clientY - offset.y,
            });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                cursor: 'move',
                padding: '10px',
            }}
        >
            {children}
        </div>
    );
};

export default function Wall() {
    const [content, setContent] = useState([]);
    const [error, setError] = useState('');
    const { email } = useParams();
    const [refreshFlag, setRefreshFlag] = useState(false);
    const { user, otherUser, setOtherUser } = useAuth();

    useEffect(() => {
        if (email) {
            setOtherUser(email);
        }
    }, [email, setOtherUser]);

    const wall_of = email ? email : otherUser;
    const wall_of_mine = otherUser == user?.email;

    useEffect(() => {
        const getMyFeedback = async () => {
            try {
                const response = await axiosInstance.get(
                    'auth/user_feedback/',
                    {
                        params: {
                            otherUser: wall_of,
                        },
                    }
                );
                setContent(response.data);
                setError('');
            } catch (err) {
                setError('Probably user is not found');
                setContent([]);
            }
        };

        getMyFeedback();
    }, [otherUser, refreshFlag, email]);

    const getNonOverlappingPositions = (numItems) => {
        const positions = [];
        const divWidth = 100;
        const divHeight = 100;
        const padding = 20;

        while (positions.length < numItems) {
            const randomX =
                Math.random() * (window.innerWidth - divWidth - padding);
            const randomY =
                Math.random() * (window.innerHeight - divHeight - padding);

            const newPosition = { left: randomX, top: randomY };
            const isOverlapping = positions.some((existingPosition) => {
                return (
                    Math.abs(existingPosition.left - newPosition.left) <
                        divWidth + padding &&
                    Math.abs(existingPosition.top - newPosition.top) <
                        divHeight + padding
                );
            });

            if (!isOverlapping) {
                positions.push(newPosition);
            }
        }
        return positions;
    };

    const positions = getNonOverlappingPositions(content.length);

    return (
        <div className="wall-container">
            <div className="content">
                {content.map((item, index) => (
                    <DraggableDiv key={index} initialPos={positions[index]}>
                        <ResizableBox
                            width={200}
                            height={100}
                            minConstraints={[150, 80]}
                            maxConstraints={[400, 300]}
                            resizeHandles={['se']}
                        >
                            <div
                                className="wall-item"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'auto',
                                    padding: 10,
                                }}
                            >
                                {item.content}
                            </div>
                        </ResizableBox>
                    </DraggableDiv>
                ))}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {wall_of_mine ? null : <Feedback setRefreshFlag={setRefreshFlag} />}
        </div>
    );
}
