// Playing around with react

// Endpoints of the provided api.
const connect_endpoint = "api/connect"
const speed_endpoint = "api/speed"

// Widget generalizes a call to the API and formatting into a table.
class Widget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {fields:[]}
  }

  // Once the Widget has initialized, we make an API to grab the needed data.
  componentDidMount() {
    // Data is specified in the provided endpoint.
    fetch(this.props.endpoint)
      // Restful API so everthing is in json.
      .then((data) => data.json())
      .then((json) => {
        // Ayyee!! We got json back. Set our state to the provided json. This
        // will invoke render again.
        if ("results" in json) this.setState({data: json["results"]})
        // Uhoh. Something went wrong. Let's log the error.
        else console.error(json["error"])
      })
  }

  // This will run whenever the state changes + on initialization.
  render() {
    // The deafult display text if no content has been loaded. Another note is
    // that this is not valid JS. The plain tags would not fly.
    let display = <b>Loading...</b>

    // Check to se if content has been loaded.
    if (this.state.data) {
      // Iterate over each of the fields to create header colums.
      let headers = this.props.fields.map((key) => {
        return (<th key={key} scope="col">{key}</th>)
      })
      // Iterate over each data point to create a row.
      let rows = this.state.data.map((row, i) => {
        let highlight = false;
        // For each field, check to see if the row is higlighted based on
        // higlight criterion, and process a cell for the row.
        let cells = this.props.fields.concat(Object.keys(this.props.highlight || {})).map((key, count) => {
          if (this.props.highlight && key.trim() in this.props.highlight) {
            highlight = highlight || row[key]== this.props.highlight[key];
          }
          if (key in row && count < this.props.fields.length) {
            let value = row[key];
            if (this.props.callbacks && key in this.props.callbacks) value = this.props.callbacks[key](value);
            return count++ == 0 ? (<th key={key} scope="row">{value}</th>) : (<td key={key}>{value}</td>);
          }
        });
        // Make the click callback either the true call back, or if none exists
        // a noop (google this, it's a fun word).
        let click = this.props.click || (()=>{});
        // We wrap our callback so it has row context.
        let callback = ()=>{click(row)};
        // Add all the classes needed for this row.
        let classes = [highlight ? "table-info" : "", this.props.click ? "clickable-row" : ""].join(" ")
        // Return the row HTML.
        return (<tr key={i} onClick={callback} className={classes}>{cells}</tr>)
      })
      // Format the collected data into a table.
      display = (
        <table className="table table-hover">
          <caption>{this.props.caption}</caption>
          <thead>
            <tr>{headers}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>)
    }
    // Return the stub loading OR the created table.
    return (
        <div className="container">{display}</div>
    )
  }
}

// Some click callbacks!
function connect_wifi(row){
  console.info("Connecting to " + row["NAME"] + "....")
  fetch(connect_endpoint + "/" + row["NAME"])
      .then((data) => data.json())
      .then((json) => {
        if ("results" in json) console.info("\n Bloop. Done did it.")
        else console.error(json["error"])
      })
}

// Speed test functionality
function format_bytes(num){ return "" + ((num/1024.) | 0) + "kB/s"}
function format_ms(num){ return "" + (num | 0) + "ms"}
function speedtest(){
  ReactDOM.render(<Widget
    endpoint="/api/speed"
    caption="Results from speedtest..."
    click={speedtest}
    callbacks={{"ping": format_ms, "download":format_bytes, "upload":format_bytes}}
    fields={["ping", "download", "upload"]} />,
    document.getElementById("speed"));
}
function button() {
  return (<button type="button" className="btn btn-outline-primary btn-lg btn-block" onClick={speedtest}>Speed Test!</button>);
}

// Add all the widgets to the page.
ReactDOM.render(<Widget
  endpoint="/api/dev"
  caption="AP points availible."
  fields={["SSID", "SIGNAL", "RATE", "SECURITY", "BSSID"]}
  highlight={{"ACTIVE":"yes"}}
  callbacks={{"BSSID":(mac)=>mac.replace(/\\/g,"")}}/>,
  document.getElementById("dev"));

ReactDOM.render(<Widget
  endpoint="/api/check"
  caption="Connected to the wifi."
  fields={["host", "ip", "mac"]} />,
  document.getElementById("check"));

ReactDOM.render(<Widget
  endpoint="/api/connect"
  caption="Connection profiles availible."
  highlight={{"ACTIVE":"yes"}}
  click={connect_wifi}
  callbacks={{"FILENAME":(file)=>file.split("/").pop()}}
  fields={["NAME", "STATE", "DEVICE", "TYPE", "FILENAME"]} />,
  document.getElementById("connect"));

ReactDOM.render(button(), document.getElementById("speed"))
