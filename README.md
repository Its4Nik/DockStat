<h1>
  <img align="center" src="https://github.com/user-attachments/assets/1ad7f65d-1ba7-4c3a-8dee-c704fb10d7f0" alt="DockStat Logo" />
</h1>
<p align="left">
  Dockstat is a monitoring frontend powered by the <a href="https://github.com/Its4Nik/dockstatapi">DockStatAPI</a>. <br>
  It provides usage statistics like CPU, RAM, and Network usage.<br>
  Integrations can also be enabled using optional variables.
  Check the documentation (WIP) <a href="https://outline.itsnik.de/s/dockstat">here</a> for more
<h1>PLEASE NOTE THAT V2 IS ON THE WAY (keep a look out for the docs!)</h1> information.<br>
  To see more screenshots please visit the wiki <a href="https://outline.itsnik.de/s/dockstat/doc/themes-BFhN6ZBbYx">here</a>.<br>
</p>

<details> 
<summary>Mockups</summary>
  <img align="center" src="https://github.com/user-attachments/assets/4ffc8cc0-9a7b-4a09-837a-b0ba65a1c806" alt="DockStat Mockup" />
  <img align="center" src="https://github.com/user-attachments/assets/723b2186-b8b4-4eea-aa3e-3f68db023338" alt="DockStat Mockup" />
</details>

<h1 align="center">🖊️ Work in Progress</h1>

- [X] Refactoring
- [X] Fix theme switcher
- [X] WebUI for API config (Read only)
- [ ] WebUI for adding/removing hosts from DockStatAPI config
- [X] Sorting for Hosts
- [X] Custom host tags (e.g., "Raspberry", "Cloudserver")
- [X] Alert System (using Apprise or similar)
- [X] Improved mobile UI
- [X] Host Stats (CPU cores, Max RAM, RAM used by containers)
- [X] More themes
- [X] More advanced sub-pages
- [X] Exclude network mode "host" from network stats or other handling
- [ ] Add "Secondary API Host" for high availability
- [ ] Persistent theme/refresh rate choice
- [X] Changable size of "Container Cards"
- [X] Integration with [cup](https://github.com/sergi0g/cup), DockStat Wiki: [Integrations - Cup](https://outline.itsnik.de/s/dockstat/doc/integrations-Agq1oL6HxF#h-cup)

---

<h1 align="center">🎁 Integrations</h1>

Integrations allow you to connect external sercives to DockStat.

## List:
- [🥤 Cup](https://github.com/sergi0g/cup)

To configure your integrations and see more details please visit the [wiki](https://outline.itsnik.de/s/dockstat/doc/integrations-Agq1oL6HxF).


---

<h1 align="center">⬇️ Installation Using Docker</h1>

```yaml
name: DockStat
services:
  # Frontend
  dockstat:
    image: ghcr.io/its4nik/dockstat:latest
    container_name: dockstat
    ports:
      - "4444:3000"
    environment:
      - API_URL="http://localhost:7070" # DockStatAPI endpoint
      - DEFAULT_THEME="dracula"
      - SECRET="CHANGME"
      - LOGO_SIZE="M" # Default Logo Size "M"
      - DM_LOGO_COLOR="#FFFFFF" # Dark mode logo color
      - LM_LOGO_COLOR="#000000" # Light mode logo color
    volumes:
      - ./dockstat/icons:/app/build/icons
    restart: always

  # API
  dockstatapi:
    image: ghcr.io/its4nik/dockstatapi:latest
    container_name: dockstatapi
    environment:
      - SECRET=CHANGEME # Required in the header 'Authorization': 'CHANGEME'
    ports:
      - "7070:7070"
    volumes:
      - ./dockstatapi:/api/config # Place your hosts.yaml file here
    restart: always
```


<h1 align="center">Configuration</h1>

[Wiki](https://outline.itsnik.de/s/dockstat/doc/customization-PiBz4OpQIZ)

---

<h1 align="center">🌟 StarHistory 🌟</h1>

[![Star History Chart](https://api.star-history.com/svg?repos=its4nik/dockstat,its4nik/dockstatapi&type=Date)](https://star-history.com/#its4nik/dockstat&its4nik/dockstatapi&Date)

---

<h1 align="center">⚠ Known Issues ⚠</h1>

### Open

3. [#24](https://github.com/Its4Nik/dockstat/issues/24)

### Resolved

1. Theme switching only works once. See [code logic](/docs/known-issues.md#-----1-theme-switching-bug) for details.

2. Adding the default theme will make other themes unusable due to not being able to select them. See [code logic](/docs/known-issues.md#-----2-theme-unavailability-issue) for details.
