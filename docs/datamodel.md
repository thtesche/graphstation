# Data Model (Graph Schema)

GraphStation uses a Labeled Property Graph (LPG) model implemented in **Memgraph**. The graph represents the relationships between photos and their metadata.

## Node Types

| Label | Description | Key Properties |
|---|---|---|
| `Owner` | Represents the Synology DSM user who owns the photos. | `name` (string) |
| `Photo` | Represents an individual photo file. | `id` (integer/string), `cache_key` (string), `takentime` (timestamp), `filename` (string) |
| `Person` | Represents a person detected in a photo. | `name` (string) |
| `Family` | Represents a family group that people belong to. | `name` (string) |
| `Location` | Represents a geographic location where a photo was taken. | `name` (string) |
| `Country` | Represents a country, used for hierarchical location lookups. | `name` (string), `type` ("Country") |
| `State` | Represents a state/province within a country. | `name` (string), `type` ("State") |

## Relationships

| Relationship | From (Source) | To (Target) | Description |
|---|---|---|---|
| `OWNED_BY` | `Photo` | `Owner` | Connects a photo to its owner. |
| `HAS_PERSON` | `Photo` | `Person` | Indicates a person is present in the photo. |
| `BELONGS_TO_FAMILY` | `Person` | `Family` | Links a person to their family group. |
| `LOCATED_AT` | `Photo` | `Location` | Connects a photo to its specific location. |
| `PART_OF` | `Location` | `Country`/`State` | Represents the hierarchical structure of locations (e.g., City -> State -> Country). |

## Example Graph Structure

```cypher
// A typical path in the graph:
(p:Photo {id: 123}) -[:OWNED_BY]-> (u:Owner {name: 'thtesche'})
(p) -[:HAS_PERSON]-> (pe:Person {name: 'John Doe'})
(pe) -[:BELONGS_TO_FAMILY]-> (f:Family {name: 'Doe Family'})
(p) -[:LOCATED_AT]-> (l:Location {name: 'Berlin'})
(l) -[:PART_OF*0..10]-> (c:Country {name: 'Germany', type: 'Country'})
```

---
*Note: This schema is maintained by the `synofoto-graph-sync` tool, which populates the graph from Synology Photos metadata.*
