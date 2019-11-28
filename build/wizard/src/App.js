import React from 'react';
import pages from "./pages";
import { BrowserRouter, Route, Switch, Link } from "react-router-dom";
import "./css/style.sass";
import AutoBahn from "./components/AutoBahn";

function App() {
    return (
        <div className="App">
        {/* <AutoBahn/> */}
            <BrowserRouter>
                <Switch>
                    {Object.values(pages).map(({ RootComponent, rootPath }) => (
                        <Route
                            key={rootPath}
                            path={rootPath}
                            exact={rootPath === "/"}
                            render={props => (
                                <RootComponent rootpath={rootPath} {...props} />
                            )}
                        />
                    ))}
                </Switch>
            </BrowserRouter>
        </div>
    );
}

export default App;
